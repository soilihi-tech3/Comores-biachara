import React from "react";

// 1. MVola Logo (Green MVola logo matching user image)
export function MvolaLogo({ height = 28, style = {} }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 4, ...style }}>
      <svg height={height} viewBox="0 0 160 55" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Signal arcs above 'M' */}
        <path d="M 32 14 A 8 8 0 0 1 48 14" stroke="#007A3D" strokeWidth="3" strokeLinecap="round" />
        <path d="M 27 9 A 14 14 0 0 1 53 9" stroke="#007A3D" strokeWidth="3" strokeLinecap="round" />
        <circle cx="40" cy="18" r="2.5" fill="#007A3D" />
        {/* MVola Text */}
        <text x="2" y="48" fill="#007A3D" fontFamily="Outfit, Inter, sans-serif" fontWeight="900" fontSize="42" letterSpacing="-1">
          MVola
        </text>
      </svg>
    </div>
  );
}

// 2. HOLO Logo (Blue HOLO logo matching user image)
export function HoloLogo({ height = 28, style = {} }) {
  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", lineHeight: 1, ...style }}>
      <span style={{
        fontFamily: "Impact, sans-serif",
        fontSize: Math.round(height * 0.85),
        fontWeight: 900,
        color: "#1E58E7",
        fontStyle: "italic",
        letterSpacing: "1px",
        lineHeight: 1
      }}>
        HOLO®
      </span>
      <span style={{
        fontFamily: "Inter, sans-serif",
        fontSize: Math.max(8, Math.round(height * 0.26)),
        fontWeight: 700,
        color: "#00A887",
        letterSpacing: "0.5px",
        marginTop: 2,
        lineHeight: 1,
        whiteSpace: "nowrap"
      }}>
        BDC – MOBILE BANKING
      </span>
    </div>
  );
}

// 3. VISA Logo Badge
export function VisaLogo({ height = 20 }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #E2E8F0", borderRadius: 6,
      padding: "3px 9px", display: "inline-flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)", height
    }}>
      <span style={{
        fontFamily: "Impact, sans-serif", fontWeight: 900, fontSize: height * 0.8,
        color: "#1A1F71", fontStyle: "italic", letterSpacing: "-0.5px"
      }}>
        VISA
      </span>
    </div>
  );
}

// 4. MasterCard Logo Badge
export function MastercardLogo({ height = 20 }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #E2E8F0", borderRadius: 6,
      padding: "3px 8px", display: "inline-flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)", height
    }}>
      <svg height={height * 0.85} viewBox="0 0 36 24" fill="none">
        <circle cx="13" cy="12" r="10" fill="#EB001B" />
        <circle cx="23" cy="12" r="10" fill="#F79E1B" fillOpacity="0.9" />
      </svg>
    </div>
  );
}

// 5. PayPal Logo Badge
export function PaypalLogo({ height = 20 }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #E2E8F0", borderRadius: 6,
      padding: "3px 9px", display: "inline-flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)", height
    }}>
      <span style={{
        fontFamily: "Impact, sans-serif", fontWeight: 900, fontSize: height * 0.75,
        color: "#003087", fontStyle: "italic"
      }}>
        Pay<span style={{ color: "#0079C1" }}>Pal</span>
      </span>
    </div>
  );
}

// 6. Virement Bancaire Badge
export function VirementLogo({ height = 20 }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #E2E8F0", borderRadius: 6,
      padding: "2px 8px", display: "inline-flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)", height
    }}>
      <span style={{ fontFamily: "sans-serif", fontWeight: 800, fontSize: Math.max(7, height * 0.38), color: "#D97706", lineHeight: 1 }}>
        Virement
      </span>
      <span style={{ fontFamily: "sans-serif", fontWeight: 800, fontSize: Math.max(7, height * 0.38), color: "#1E293B", lineHeight: 1 }}>
        Bancaire
      </span>
    </div>
  );
}

// 7. Cash Logo (Hand holding green Euro banknote - matching exact user photo)
export function CashLogo({ height = 30, style = {} }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, ...style }}>
      <svg height={height} viewBox="0 0 100 90" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Back banknote */}
        <polygon points="30,5 92,18 78,55 16,42" fill="#2D7A3A" />
        {/* Front banknote main body */}
        <polygon points="22,12 84,25 70,62 8,49" fill="#5BB450" stroke="#1F4D25" strokeWidth="3" />
        {/* Center circle for euro symbol */}
        <circle cx="46" cy="37" r="14" fill="#2E6B34" />
        <text x="40" y="44" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="900" fontSize="18">€</text>
        {/* Corner details on bill */}
        <circle cx="28" cy="22" r="3" fill="#8CE082" />
        <circle cx="64" cy="52" r="3" fill="#8CE082" />
        
        {/* Hand holding cash */}
        <path d="M 5,45 L 24,45 L 24,80 L 5,80 Z" fill="#3D3D3D" stroke="#252525" strokeWidth="4" />
        <path d="M 24,50 Q 55,50 68,57 C 72,59 70,66 65,68 Q 52,66 52,74 C 70,72 98,58 95,72 C 92,86 52,90 24,80 Z" 
              fill="#DDA16E" stroke="#252525" strokeWidth="4" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

// 8. Combined Payment Badges (VISA + Mastercard + Virement + Paypal)
export function OnlinePaymentBadges({ style = {} }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap", ...style }}>
      <VisaLogo height={22} />
      <MastercardLogo height={22} />
      <VirementLogo height={22} />
      <PaypalLogo height={22} />
    </div>
  );
}
