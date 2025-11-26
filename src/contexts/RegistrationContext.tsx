import React, { createContext, useContext, useState, ReactNode } from 'react';

interface RegistrationData {
  referralCode: string;
  firstName: string;
  lastName: string;
  honorificTitle: string;
  email: string;
  mobile: string;
  jobFunction: string;
  activityDomain: string;
  personalQuote: string;
  isFounder: boolean;
  wealthAmount: string;
  wealthUnit: string;
  wealthCurrency: string;
}

interface RegistrationContextType {
  registrationData: RegistrationData | null;
  avatarPreview: string | null;
  setRegistrationData: (data: RegistrationData | null) => void;
  setAvatarPreview: (preview: string | null) => void;
  clearRegistrationData: () => void;
}

const RegistrationContext = createContext<RegistrationContextType | undefined>(undefined);

export const RegistrationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const clearRegistrationData = () => {
    setRegistrationData(null);
    setAvatarPreview(null);
  };

  return (
    <RegistrationContext.Provider
      value={{
        registrationData,
        avatarPreview,
        setRegistrationData,
        setAvatarPreview,
        clearRegistrationData,
      }}
    >
      {children}
    </RegistrationContext.Provider>
  );
};

export const useRegistration = () => {
  const context = useContext(RegistrationContext);
  if (context === undefined) {
    throw new Error('useRegistration must be used within a RegistrationProvider');
  }
  return context;
};

