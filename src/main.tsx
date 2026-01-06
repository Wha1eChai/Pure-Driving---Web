import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DrivingProvider } from './contexts/DrivingContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { PracticePage } from './pages/PracticePage';
import { MistakesPage } from './pages/MistakesPage';
import { ExamPage } from './pages/ExamPage';
import { RandomPracticePage } from './pages/RandomPracticePage';
import { HiddenQuestionsPage } from './pages/HiddenQuestionsPage';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SettingsProvider>
      <DrivingProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="practice" element={<PracticePage />} />
              <Route path="random" element={<RandomPracticePage />} />
              <Route path="mistakes" element={<MistakesPage />} />
              <Route path="hidden" element={<HiddenQuestionsPage />} />
              <Route path="exam" element={<ExamPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </DrivingProvider>
    </SettingsProvider>
  </React.StrictMode>
);