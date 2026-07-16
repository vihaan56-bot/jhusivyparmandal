import React, { useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTenant } from '../context/TenantContext';
import { Button } from './ui/CustomUI';

interface QRCardProps {
  membership: {
    shopName: string;
    category: string;
    ownerName: string;
    membershipCardNumber: string;
    membershipExpiry: string;
    status: string;
  };
}

export const QRCard: React.FC<QRCardProps> = ({ membership }) => {
  const { t } = useLanguage();
  const { activeAssociation } = useTenant();
  const cardRef = useRef<HTMLDivElement>(null);

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    JSON.stringify({
      id: membership.membershipCardNumber,
      shop: membership.shopName,
      owner: membership.ownerName,
      status: membership.status,
      association: activeAssociation?.name
    })
  )}`;

  const handlePrint = () => {
    const printContent = cardRef.current?.innerHTML;
    const originalContent = document.body.innerHTML;

    if (printContent) {
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(`
          <html>
            <head>
              <title>Membership Card - ${membership.shopName}</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                  margin: 0;
                  background-color: #f3f4f6;
                }
                .card-container {
                  width: 400px;
                  border: 2px solid #e5e7eb;
                  background: white;
                  padding: 24px;
                  border-radius: 16px;
                  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                  text-align: center;
                }
                .logo {
                  max-width: 60px;
                  border-radius: 50%;
                  margin-bottom: 12px;
                }
                .assoc-name {
                  font-size: 16px;
                  font-weight: bold;
                  color: #1f2937;
                  margin-bottom: 16px;
                }
                .title {
                  font-size: 18px;
                  font-weight: 800;
                  color: ${activeAssociation?.primaryColor || '#0284c7'};
                  margin-bottom: 20px;
                }
                .details {
                  text-align: left;
                  font-size: 14px;
                  color: #4b5563;
                  margin-bottom: 20px;
                }
                .details div {
                  margin-bottom: 8px;
                }
                .qr-img {
                  margin-top: 16px;
                  width: 150px;
                  height: 150px;
                }
              </style>
            </head>
            <body>
              <div class="card-container">
                ${activeAssociation?.logoUrl ? `<img class="logo" src="${activeAssociation.logoUrl}" />` : ''}
                <div class="assoc-name">${activeAssociation?.name || 'Vyapar Mandal'}</div>
                <div class="title">DIGITAL MEMBERSHIP CARD</div>
                <div class="details">
                  <div><strong>Shop:</strong> ${membership.shopName}</div>
                  <div><strong>Owner:</strong> ${membership.ownerName}</div>
                  <div><strong>Category:</strong> ${membership.category}</div>
                  <div><strong>Card No:</strong> ${membership.membershipCardNumber}</div>
                  <div><strong>Valid Till:</strong> ${membership.membershipExpiry}</div>
                  <div><strong>Status:</strong> <span style="color: #10b981; font-weight: bold;">${membership.status.toUpperCase()}</span></div>
                </div>
                <img class="qr-img" src="${qrCodeUrl}" />
              </div>
              <script>
                window.onload = function() {
                  window.print();
                  setTimeout(function() { window.close(); }, 500);
                };
              </script>
            </body>
          </html>
        `);
        win.document.close();
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Visual Premium Card */}
      <div 
        ref={cardRef}
        className="relative overflow-hidden w-full max-w-sm h-64 rounded-2xl p-6 text-white shadow-2xl flex flex-col justify-between transition-transform duration-300 hover:scale-[1.02] cursor-pointer"
        style={{
          background: `linear-gradient(135deg, ${activeAssociation?.primaryColor || '#0284c7'} 0%, ${activeAssociation?.secondaryColor || '#f59e0b'} 100%)`
        }}
      >
        {/* Subtle Decorative Elements */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-black/10 rounded-full blur-xl -ml-16 -mb-16 pointer-events-none" />

        {/* Card Top */}
        <div className="flex justify-between items-start z-10">
          <div className="flex items-center gap-3">
            {activeAssociation?.logoUrl ? (
              <img 
                src={activeAssociation.logoUrl} 
                alt="Logo" 
                className="w-10 h-10 rounded-full border border-white/20 object-cover bg-white"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">
                VM
              </div>
            )}
            <div>
              <h4 className="font-bold text-sm tracking-tight line-clamp-1">
                {activeAssociation?.name || 'Vyapar Mandal'}
              </h4>
              <p className="text-[10px] text-white/80">Digital Member Profile</p>
            </div>
          </div>
          <span className="bg-emerald-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            {t(membership.status)}
          </span>
        </div>

        {/* Card Body */}
        <div className="flex justify-between items-end mt-4 z-10">
          <div className="space-y-1">
            <h3 className="font-black text-lg tracking-wide uppercase line-clamp-1">
              {membership.shopName}
            </h3>
            <div className="text-xs text-white/90">
              <span className="opacity-75">Owner: </span>{membership.ownerName}
            </div>
            <div className="text-[11px] text-white/85">
              <span className="opacity-75">Cat: </span>{membership.category}
            </div>
            <div className="text-[10px] text-white/70 font-mono mt-1">
              EXP: {membership.membershipExpiry}
            </div>
          </div>

          {/* Mini QR display inside Card */}
          <div className="bg-white p-1.5 rounded-lg shadow-lg flex items-center justify-center shrink-0">
            <img 
              src={qrCodeUrl} 
              alt="QR Card" 
              className="w-16 h-16"
            />
          </div>
        </div>

        {/* Card Footer */}
        <div className="border-t border-white/10 pt-2 flex justify-between items-center text-[10px] font-mono text-white/85 z-10">
          <span>NO: {membership.membershipCardNumber}</span>
          <span className="tracking-widest uppercase font-bold text-[8px] bg-white/10 px-1.5 py-0.5 rounded">
            Verified Partner
          </span>
        </div>
      </div>

      <div className="flex gap-2 w-full max-w-sm justify-center">
        <Button variant="outline" size="sm" onClick={handlePrint} className="w-full">
          🖨️ {t('Print / Download')}
        </Button>
      </div>
    </div>
  );
};
