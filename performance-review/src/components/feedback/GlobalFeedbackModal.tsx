import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import Modal from '../common/Modal';
import FormField from '../forms/FormField';
import FormSelect from '../forms/FormSelect';
import FormTextarea from '../forms/FormTextarea';
import FormCheckbox from '../forms/FormCheckbox';

// Types
export type FeedbackType = 'commendation' | 'guidance' | 'constructive';
export type FeedbackVisibility = 'private' | 'public';

export interface FeedbackFormData {
  recipient_id: number;
  feedback_type: FeedbackType;
  visibility: FeedbackVisibility;
  content: string;
  tags: string[];
  related_entity_type?: 'goal' | 'objective' | 'task';
  related_entity_id?: number;
  is_anonymous: boolean;
}

export interface GlobalFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FeedbackFormData) => Promise<void>;
  users?: Array<{ id: number; name: string; role: string; department: string }>;
  entities?: Array<{ id: number; title: string; type: 'goal' | 'objective' | 'task' }>;
  currentUserId?: number;
}

// Validation Schema
const feedbackValidationSchema = Yup.object({
  recipient_id: Yup.number()
    .required('Please select a recipient')
    .min(1, 'Please select a valid recipient'),
  feedback_type: Yup.string()
    .oneOf(['commendation', 'guidance', 'constructive'], 'Please select a valid feedback type')
    .required('Please select a feedback type'),
  visibility: Yup.string()
    .oneOf(['private', 'public'], 'Please select visibility')
    .required('Please select visibility'),
  content: Yup.string()
    .required('Please provide feedback content')
    .min(10, 'Feedback must be at least 10 characters')
    .max(500, 'Feedback cannot exceed 500 characters'),
  tags: Yup.array().of(Yup.string()),
  related_entity_type: Yup.string().oneOf(['goal', 'objective', 'task']).nullable(),
  related_entity_id: Yup.number().nullable(),
  is_anonymous: Yup.boolean(),
});

// Predefined tags
const PREDEFINED_TAGS = [
  'Communication',
  'Leadership',
  'Teamwork',
  'Problem Solving',
  'Innovation',
  'Time Management',
  'Quality',
  'Customer Focus',
  'Technical Skills',
  'Mentoring',
  'Initiative',
  'Adaptability',
];

const GlobalFeedbackModal: React.FC<GlobalFeedbackModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  users = [],
  entities = [],
  currentUserId,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter out current user from recipients
  const availableUsers = users.filter(user => user.id !== currentUserId);

  const feedbackTypeOptions = [
    { value: 'commendation', label: 'Commendation - Positive recognition' },
    { value: 'guidance', label: 'Guidance - Helpful suggestions' },
    { value: 'constructive', label: 'Constructive - Areas for improvement' },
  ];

  const visibilityOptions = [
    { value: 'private', label: 'Private - Only visible to recipient and managers' },
    { value: 'public', label: 'Public - Visible to team members' },
  ];

  const userOptions = availableUsers.map(user => ({
    value: user.id,
    label: `${user.name} (${user.role} - ${user.department})`,
  }));

  const entityOptions = entities.map(entity => ({
    value: entity.id,
    label: `${entity.title} (${entity.type})`,
  }));

  const entityTypeOptions = [
    { value: '', label: 'Not related to specific item' },
    { value: 'goal', label: 'Goal' },
    { value: 'objective', label: 'Objective' },
    { value: 'task', label: 'Task' },
  ];

  const initialValues: FeedbackFormData = {
    recipient_id: 0,
    feedback_type: 'commendation',
    visibility: 'private',
    content: '',
    tags: [],
    related_entity_type: undefined,
    related_entity_id: undefined,
    is_anonymous: false,
  };

  const handleSubmit = async (values: FeedbackFormData, { resetForm }: any) => {
    try {
      setIsSubmitting(true);
      await onSubmit(values);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Give Feedback"
      size="lg"
      className="max-h-[90vh] overflow-y-auto"
    >
      <Formik
        initialValues={initialValues}
        validationSchema={feedbackValidationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, setFieldValue, errors, touched }) => (
          <Form className="space-y-6">
            {/* Recipient Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient *
              </label>
              <Field name="recipient_id">
                {({ field }: any) => (
                  <FormSelect
                    {...field}
                    label=""
                    options={userOptions}
                    placeholder="Select a recipient"
                    error={touched.recipient_id && errors.recipient_id ? errors.recipient_id : undefined}
                    onChange={(e) => setFieldValue('recipient_id', parseInt(e.target.value))}
                  />
                )}
              </Field>
            </div>

            {/* Feedback Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Feedback Type *
              </label>
              <Field name="feedback_type">
                {({ field }: any) => (
                  <FormSelect
                    {...field}
                    label=""
                    options={feedbackTypeOptions}
                    error={touched.feedback_type && errors.feedback_type ? errors.feedback_type : undefined}
                    onChange={(e) => setFieldValue('feedback_type', e.target.value)}
                  />
                )}
              </Field>
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visibility *
              </label>
              <Field name="visibility">
                {({ field }: any) => (
                  <FormSelect
                    {...field}
                    label=""
                    options={visibilityOptions}
                    error={touched.visibility && errors.visibility ? errors.visibility : undefined}
                    onChange={(e) => setFieldValue('visibility', e.target.value)}
                  />
                )}
              </Field>
            </div>

            {/* Content */}
            <div>
              <Field name="content">
                {({ field }: any) => (
                  <FormTextarea
                    {...field}
                    label="Feedback Content *"
                    placeholder="Share your feedback..."
                    rows={4}
                    maxLength={500}
                    showCharCount={true}
                    error={touched.content && errors.content ? errors.content : undefined}
                    onChange={(e) => setFieldValue('content', e.target.value)}
                  />
                )}
              </Field>
            </div>

            {/* Related Entity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Related to
                </label>
                <Field name="related_entity_type">
                  {({ field }: any) => (
                    <FormSelect
                      {...field}
                      label=""
                      options={entityTypeOptions}
                      onChange={(e) => {
                        setFieldValue('related_entity_type', e.target.value || undefined);
                        setFieldValue('related_entity_id', undefined);
                      }}
                    />
                  )}
                </Field>
              </div>

              {values.related_entity_type && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select {values.related_entity_type}
                  </label>
                  <Field name="related_entity_id">
                    {({ field }: any) => (
                      <FormSelect
                        {...field}
                        label=""
                        options={entityOptions.filter(e => e.label.includes(`(${values.related_entity_type})`))}
                        placeholder={`Select a ${values.related_entity_type}`}
                        onChange={(e) => setFieldValue('related_entity_id', parseInt(e.target.value))}
                      />
                    )}
                  </Field>
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (Select relevant skills/areas)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {PREDEFINED_TAGS.map((tag) => (
                  <Field key={tag} name="tags">
                    {({ field }: any) => (
                      <FormCheckbox
                        name={`tag-${tag}`}
                        label={tag}
                        checked={values.tags.includes(tag)}
                        onChange={(e) => {
                          const newTags = e.target.checked
                            ? [...values.tags, tag]
                            : values.tags.filter(t => t !== tag);
                          setFieldValue('tags', newTags);
                        }}
                      />
                    )}
                  </Field>
                ))}
              </div>
            </div>

            {/* Anonymous Option */}
            <div>
              <Field name="is_anonymous">
                {({ field }: any) => (
                  <FormCheckbox
                    {...field}
                    label="Submit anonymously"
                    description="Your identity will be hidden from the recipient"
                    checked={values.is_anonymous}
                    onChange={(e) => setFieldValue('is_anonymous', e.target.checked)}
                  />
                )}
              </Field>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                className="btn-outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </Modal>
  );
};

export default GlobalFeedbackModal; 