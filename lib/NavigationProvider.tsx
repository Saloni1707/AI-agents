"use client";

import { createContext, useState, useContext, useCallback } from "react";

interface NavigationContextType {
    isMobileNavOpen: boolean;
    setIsMobileNavOpen: (open: boolean) => void;
    closeMobileNav: () => void;
}

export const NavigationContext = createContext<NavigationContextType>({
    isMobileNavOpen: false,
    setIsMobileNavOpen: () => {}, // Empty function for default
    closeMobileNav: () => {},    // Empty function for default
});

export function NavigationProvider({ children }: { children: React.ReactNode }) {
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    const updateMobileNav = (open: boolean) => {
        setIsMobileNavOpen(open);
    };

    const closeMobileNav = () => {
        setIsMobileNavOpen(false);
    };

    console.log('Provider current state:', isMobileNavOpen);

    return (
        <NavigationContext.Provider
            value={{
                isMobileNavOpen,
                setIsMobileNavOpen: updateMobileNav,
                closeMobileNav
            }}
        >
            {children}
        </NavigationContext.Provider>
    );
}

// Custom hook for easier context usage
export function useNavigation() {
    const context = useContext(NavigationContext);
    if (!context) {
        throw new Error('useNavigation must be used within a NavigationProvider');
    }
    return context;
}
