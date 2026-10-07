import React from 'react';
import { ReferralScreen } from './ReferralScreen';

interface TeamsScreenProps {
  onBack?: () => void;
  showBack?: boolean;
}

export const TeamsScreen: React.FC<TeamsScreenProps> = ({ onBack, showBack = true }) => {
  return <ReferralScreen onBack={onBack} showBack={showBack} />;
};
