import json
import os
import re
import sys
import argparse

# Get script directory
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, '..', '..'))
PUBLIC_DATA_DIR = os.path.join(PROJECT_ROOT, 'driving-test', 'public', 'data')

def validate_dataset(file_name):
    # Resolve path: if absolute, use it; if relative, assume in public/data
    if os.path.isabs(file_name):
        file_path = file_name
    else:
        file_path = os.path.join(PUBLIC_DATA_DIR, file_name)

    print(f"--- Validating {file_path} ---")

    if not os.path.exists(file_path):
        print("File not found.")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        questions = json.load(f)

    stats = {
        "total": len(questions),
        "critical_errors": 0,
        "image_warnings": 0,
        "content_warnings": 0
    }

    report = []

    # Keywords that imply an image should exist
    img_keywords = ['如图', '图中', '图片', '标志', '标线', '手势']

    for q in questions:
        q_id = q.get('id')
        text = q.get('question', '').strip()
        options = q.get('options', {})
        answer = q.get('answer', '')
        images = q.get('images', [])

        issues = []

        # 1. Critical Checks
        if not text or len(text) < 2:
            issues.append("[CRITICAL] Question text empty or too short")
            stats["critical_errors"] += 1

        if not options:
            issues.append("[CRITICAL] No options found")
            stats["critical_errors"] += 1

        if not answer:
            issues.append("[CRITICAL] No answer defined")
            stats["critical_errors"] += 1
        elif answer not in options:
            # Sometimes answer is "正确" but options keys are "A", "B".
            # Check values too
            found_val = False
            for k, v in options.items():
                if answer == v:
                    found_val = True
                    break
            if not found_val and answer not in options:
                 issues.append(f"[CRITICAL] Answer '{answer}' not found in options keys {list(options.keys())}")
                 stats["critical_errors"] += 1

        # 2. Image Checks
        if len(images) > 3:
            issues.append(f"[WARN] Too many images: {len(images)} detected (Likely parsing junk)")
            stats["image_warnings"] += 1

        # Check for missing images (heuristic)
        needs_image = any(k in text for k in img_keywords)
        if needs_image and not images:
            # This is a soft warning, sometimes "标志" refers to text description
            # But "如图" usually guarantees an image
            if '如图' in text or '图中' in text:
                issues.append("[WARN] Text says 'As Shown' but NO image found")
                stats["image_warnings"] += 1

        # 3. Content Checks
        if len(text) > 500:
             issues.append(f"[WARN] Text unusually long ({len(text)} chars). Possible merge error.")
             stats["content_warnings"] += 1

        if issues:
            report.append({
                "id": q_id,
                "text_preview": text[:30] + "...",
                "issues": issues
            })

    # Output Report
    print(f"Total Questions: {stats['total']}")
    print(f"Critical Errors: {stats['critical_errors']}")
    print(f"Image Warnings:  {stats['image_warnings']}")
    print(f"Content Warnings:{stats['content_warnings']}")
    print("\n--- Detailed Report (Top 20 Issues) ---")

    for item in report[:20]:
        print(f"ID: {item['id']}")
        print(f"  Question: {item['text_preview']}")
        for issue in item['issues']:
            print(f"  - {issue}")
        print("-" * 40)

    # Optional: Suggest IDs to auto-hide
    bad_ids = [item['id'] for item in report if any('CRITICAL' in i or 'Too many' in i for i in item['issues'])]
    if bad_ids:
        print(f"\nSuggest adding these IDs to hidden list: {bad_ids[:10]}...")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Validate JSON question dataset')
    parser.add_argument('--file', '-f', default='questions_full.json', help='JSON file name in public/data (or absolute path)')

    args = parser.parse_args()
    validate_dataset(args.file)
