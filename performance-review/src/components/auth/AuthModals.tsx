import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ManagerSelectionModal from './ManagerSelectionModal';
import TeamSelectionModal from './TeamSelectionModal';

export function AuthModals() {
  const { needsManagerAssignment, needsTeamAssignment } = useAuth();

  return (
    <>
      {/* Manager Selection Modal for Individual Contributors */}
      <ManagerSelectionModal
        isOpen={needsManagerAssignment}
        onClose={() => {}} // Cannot close without selection
      />

      {/* Team Selection Modal for Managers */}
      <TeamSelectionModal
        isOpen={needsTeamAssignment}
        onClose={() => {
          // This will be handled by the context when assignment is complete
        }}
      />
    </>
  );
}

export default AuthModals; 