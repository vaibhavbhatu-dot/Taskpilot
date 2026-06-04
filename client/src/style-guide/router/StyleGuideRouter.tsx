import { Routes, Route, Navigate } from 'react-router-dom';
import { DocsLayout } from '../components/layout/DocsLayout';

import { ColorsPage }     from '../pages/foundations/ColorsPage';
import { TypographyPage } from '../pages/foundations/TypographyPage';
import { SpacingPage }    from '../pages/foundations/SpacingPage';
import { LayoutPage }     from '../pages/foundations/LayoutPage';

import { ButtonPage }   from '../pages/components/ButtonPage';
import { InputPage }    from '../pages/components/InputPage';
import { CardPage }     from '../pages/components/CardPage';
import { BadgePage }    from '../pages/components/BadgePage';
import { AlertPage }    from '../pages/components/AlertPage';
import { FeedbackPage } from '../pages/components/FeedbackPage';
import { ModalPage }         from '../pages/components/ModalPage';
import { SelectPage }        from '../pages/components/SelectPage';
import { AISuggestionPage } from '../pages/components/AISuggestionPage';
import { OtpPage }          from '../pages/components/OtpPage';
import { StepperPage }      from '../pages/components/StepperPage';

import { ScoreBarPage }   from '../pages/product/ScoreBarPage';
import { ResumeCardPage } from '../pages/product/ResumeCardPage';
import { UploadZonePage } from '../pages/product/UploadZonePage';

export function StyleGuideRouter() {
  return (
    <Routes>
      <Route element={<DocsLayout />}>

        {/* Default redirect */}
        <Route index element={<Navigate to="foundations/colors" replace />} />

        {/* Foundations */}
        <Route path="foundations/colors"     element={<ColorsPage />}     />
        <Route path="foundations/typography" element={<TypographyPage />} />
        <Route path="foundations/spacing"    element={<SpacingPage />}    />
        <Route path="foundations/layout"     element={<LayoutPage />}     />

        {/* Components */}
        <Route path="components/button"   element={<ButtonPage />}   />
        <Route path="components/input"    element={<InputPage />}    />
        <Route path="components/card"     element={<CardPage />}     />
        <Route path="components/badge"    element={<BadgePage />}    />
        <Route path="components/alert"    element={<AlertPage />}    />
        <Route path="components/feedback" element={<FeedbackPage />} />
        <Route path="components/modal"         element={<ModalPage />}         />
        <Route path="components/select"        element={<SelectPage />}        />
        <Route path="components/ai-suggestion" element={<AISuggestionPage />}  />
        <Route path="components/otp-input"     element={<OtpPage />}           />
        <Route path="components/stepper"       element={<StepperPage />}       />

        {/* Product */}
        <Route path="product/score-bar"   element={<ScoreBarPage />}   />
        <Route path="product/resume-card" element={<ResumeCardPage />} />
        <Route path="product/upload-zone" element={<UploadZonePage />} />

        {/* Catch-all → colors */}
        <Route path="*" element={<Navigate to="foundations/colors" replace />} />

      </Route>
    </Routes>
  );
}
