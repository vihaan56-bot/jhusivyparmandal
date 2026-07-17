import React, { createContext, useContext, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dataService } from '../services/dataService';

export interface Association {
  id: string;
  name: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  active: boolean;
  createdAt: string;
  aboutText?: string;
  aboutImageUrl?: string;
}

interface TenantContextType {
  activeAssociation: Association | null;
  loading: boolean;
  error: string | null;
  tenantId: string | undefined;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

// Helper to convert hex to HSL numbers for Tailwind HSL format
function hexToHsl(hex: string): string {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  if (hex.length !== 6) return '221.2 83.2% 53.3%'; // Fallback blue

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const tenantId = 'jhusi-prayagraj';
  const [activeAssociation, setActiveAssociation] = useState<Association | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Fetch association details for Prayagraj
    dataService.getAssociation(tenantId)
      .then(async (association) => {
        if (association && association.active) {
          setActiveAssociation(association);
          
          // Apply dynamic CSS variables
          const primaryHsl = hexToHsl(association.primaryColor);
          const secondaryHsl = hexToHsl(association.secondaryColor);
          
          document.documentElement.style.setProperty('--primary', primaryHsl);
          document.documentElement.style.setProperty('--secondary', secondaryHsl);
          document.documentElement.style.setProperty('--ring', primaryHsl);
        } else {
          // If not found in database (fresh launch), create default Prayagraj record
          const defaultAssoc: Association = {
            id: 'jhusi-prayagraj',
            name: 'Jhusi Vyapar Mandal, Prayagraj',
            logoUrl: '/logo.png',
            primaryColor: '#1e3a8a',
            secondaryColor: '#d97706',
            contactEmail: 'contact@jhusivyaparmandal.org',
            contactPhone: '+91 94152 16180',
            address: 'Main Bazaar Road, Jhusi, Prayagraj, Uttar Pradesh - 211019',
            active: true,
            createdAt: new Date().toISOString()
          };
          
          await dataService.createAssociation(defaultAssoc);
          setActiveAssociation(defaultAssoc);
          
          const primaryHsl = hexToHsl(defaultAssoc.primaryColor);
          const secondaryHsl = hexToHsl(defaultAssoc.secondaryColor);
          document.documentElement.style.setProperty('--primary', primaryHsl);
          document.documentElement.style.setProperty('--secondary', secondaryHsl);
          document.documentElement.style.setProperty('--ring', primaryHsl);
        }
      })
      .catch(err => {
        console.error('Error fetching association:', err);
        setError('Failed to load association configuration');
        setActiveAssociation(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <TenantContext.Provider value={{ activeAssociation, loading, error, tenantId }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
