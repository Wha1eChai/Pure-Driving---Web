import re
import json
import os
from html.parser import HTMLParser

class WordHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.paragraphs = [] # List of {'text': str, 'images': []}
        self.current_text = []
        self.current_images = []
        self.in_p = False

    def handle_starttag(self, tag, attrs):
        if tag in ['p', 'div', 'h1', 'h2', 'h3']:
            self.in_p = True
            self.current_text = []
            self.current_images = []
        elif tag == 'br':
            self.current_text.append('\n')

        self._extract_image_from_attrs(attrs)

    def handle_endtag(self, tag):
        if tag in ['p', 'div', 'h1', 'h2', 'h3']:
            self.in_p = False
            text = ''.join(self.current_text).strip()
            # Clean up text
            text = text.replace('\xa0', ' ').replace('\r', '')

            # Store paragraph if it has content or images
            if text or self.current_images:
                self.paragraphs.append({
                    'text': text,
                    'images': self.current_images[:]
                })
            self.current_text = []
            self.current_images = []

    def handle_data(self, data):
        self.current_text.append(data)

    def handle_comment(self, data):
        img_matches = re.findall(r'src=["\'](.*?)["\']', data)
        for src in img_matches:
            if 'full_output.files' in src or 'sample_output.files' in src:
                 if src not in self.current_images:
                     self.current_images.append(src)

    def _extract_image_from_attrs(self, attrs):
        for attr, value in attrs:
            if attr == 'src':
                if 'full_output.files' in value or 'sample_output.files' in value:
                    if value not in self.current_images:
                        self.current_images.append(value)

def read_file_with_encoding(path):
    encodings = ['utf-8', 'gb18030', 'gbk', 'cp936']
    for enc in encodings:
        try:
            with open(path, 'r', encoding=enc) as f:
                content = f.read()
            if '答案' in content or '题目' in content or '正确' in content:
                print(f"Successfully read with encoding: {enc}")
                return content
        except UnicodeDecodeError:
            continue
    print("Warning: Fallback to utf-8 ignore.")
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        return f.read()

def parse_questions_from_html(html_file_path):
    if not os.path.exists(html_file_path):
        print(f"Error: {html_file_path} not found.")
        return []

    content = read_file_with_encoding(html_file_path)
    parser = WordHTMLParser()
    parser.feed(content)

    questions = []
    current_q = None

    # Regex Patterns
    q_start_pattern = re.compile(r'^(\d+)[\.、\s]\s*(.*)')
    opt_pattern = re.compile(r'^([A-D])[\.、\s]\s*(.*)')
    ans_pattern = re.compile(r'^(?:答案|Answer)[:：]\s*([A-Z×√]+|正确|错误)')

    # Buffer for images found *between* questions (or just after question text)
    pending_images = []

    def finalize_question(q):
        if not q: return None

        # FIX 1: Auto-fill Judgment Options
        if not q['options']:
            q['type'] = 'judgment'
            q['options'] = {'A': '正确', 'B': '错误'}

            # FIX 2: Normalize Answer
            ans = q['answer']
            if ans in ['正确', '√', 'Y', 'TRUE']:
                q['answer'] = 'A'
            elif ans in ['错误', '×', 'N', 'FALSE']:
                q['answer'] = 'B'
        else:
            q['type'] = 'choice'

        # FIX 3: Image Limit (Prevent "wall of icons")
        if len(q['images']) > 3:
            # Heuristic: If >3 images, it's likely a summary page or parsing noise.
            # We keep only the first 2 as a safety measure, or 0 if it looks totally junk.
            # Let's keep 2.
            q['images'] = q['images'][:2]

        return q

    for p in parser.paragraphs:
        text = p['text']
        images = p['images']

        # Pre-process lines
        lines = text.split('\n')

        for line_idx, line in enumerate(lines):
            line = line.strip()

            # 1. Check for Question Start
            q_match = q_start_pattern.match(line)
            if q_match:
                # Save previous
                if current_q:
                    finalized = finalize_question(current_q)
                    if finalized: questions.append(finalized)

                q_id = q_match.group(1)
                q_text = q_match.group(2)

                # Start new
                current_q = {
                    "id": q_id,
                    "question": q_text,
                    "options": {},
                    "answer": None,
                    "type": "unknown",
                    "images": []
                }

                # If we had pending images from previous paragraphs that weren't assigned,
                # they might belong to THIS question (if they appeared right before it?).
                # Usually images appear AFTER or INSIDE.
                # Let's assume images in the SAME paragraph as the question start belong to it.
                if images:
                    for img in images:
                        if img not in current_q['images']:
                            current_q['images'].append(img)
                continue

            if not current_q:
                continue

            # 2. Check for Answer
            ans_match = ans_pattern.match(line)
            if ans_match:
                ans = ans_match.group(1)
                current_q['answer'] = ans
                continue

            # 3. Check for Options
            opt_match = opt_pattern.match(line)
            if opt_match:
                key = opt_match.group(1)
                val = opt_match.group(2)
                current_q['options'][key] = val
                continue

            # 4. Continuation
            if not current_q['options'] and not current_q['answer']:
                # Assume part of question text
                if len(line) > 1: # Skip noise
                    current_q['question'] += "\n" + line

        # Handle images in non-start paragraphs
        if current_q and images and not q_start_pattern.match(text):
             # These are images in paragraphs FOLLOWING the question text
             for img in images:
                 if img not in current_q['images']:
                     current_q['images'].append(img)

    # Append last
    if current_q:
        finalized = finalize_question(current_q)
        if finalized: questions.append(finalized)

    return questions

import sys

# Get script directory
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# Assume project root is parent of SCRIPT_DIR/driving-test/scripts -> so 3 levels up?
# Wait, file is at driving-test/scripts/parse_html_questions.py
# So project root (where .doc files are) is SCRIPT_DIR/../../
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, '..', '..'))
PUBLIC_DATA_DIR = os.path.join(PROJECT_ROOT, 'driving-test', 'public', 'data')

# ... (HTMLParser class remains same)

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Parse Word HTML to JSON questions')
    parser.add_argument('--input', '-i', required=True, help='Input HTML file path (relative to root or absolute)')
    parser.add_argument('--output', '-o', required=True, help='Output JSON file name (will be saved to public/data/)')

    args = parser.parse_args()

    # Resolve input path
    input_path = args.input
    if not os.path.isabs(input_path):
        input_path = os.path.join(PROJECT_ROOT, input_path)

    output_path = os.path.join(PUBLIC_DATA_DIR, args.output)

    print(f"Working Directory: {PROJECT_ROOT}")
    print(f"Input: {input_path}")
    print(f"Output: {output_path}")

    data = parse_questions_from_html(input_path)
    print(f"Parsed {len(data)} questions.")

    if data:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Successfully saved to {output_path}")
