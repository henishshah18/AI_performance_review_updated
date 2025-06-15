import React from 'react';
import { Route } from 'react-router-dom';
import { ProtectedRoute } from '../components/auth';
import { Layout } from '../components/layout';
import { ReviewsPage } from '../pages/reviews/ReviewsPage';
import { SelfAssessmentPage } from '../pages/reviews/SelfAssessmentPage';
import { PeerReviewPage } from '../pages/reviews/PeerReviewPage';

export const reviewRoutes = [
  <Route 
    key="reviews"
    path="/reviews" 
    element={
      <ProtectedRoute>
        <Layout>
          <ReviewsPage />
        </Layout>
      </ProtectedRoute>
    } 
  />,
  
  <Route 
    key="self-assessment"
    path="/reviews/self-assessment" 
    element={
      <ProtectedRoute>
        <SelfAssessmentPage />
      </ProtectedRoute>
    } 
  />,

  <Route 
    key="self-assessment-cycle"
    path="/reviews/self-assessment/:cycleId" 
    element={
      <ProtectedRoute>
        <SelfAssessmentPage />
      </ProtectedRoute>
    } 
  />,

  <Route 
    key="self-assessment-edit"
    path="/reviews/self-assessment/:cycleId/:assessmentId" 
    element={
      <ProtectedRoute>
        <SelfAssessmentPage />
      </ProtectedRoute>
    } 
  />,

  <Route 
    key="peer-review"
    path="/reviews/peer-review" 
    element={
      <ProtectedRoute>
        <PeerReviewPage />
      </ProtectedRoute>
    } 
  />,

  <Route 
    key="peer-review-create"
    path="/reviews/peer-review/:cycleId/:revieweeId" 
    element={
      <ProtectedRoute>
        <PeerReviewPage />
      </ProtectedRoute>
    } 
  />,

  <Route 
    key="peer-review-edit"
    path="/reviews/peer-review/:cycleId/:revieweeId/:reviewId" 
    element={
      <ProtectedRoute>
        <PeerReviewPage />
      </ProtectedRoute>
    } 
  />
]; 