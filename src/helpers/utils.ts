// src/helpers/utils.ts

export const detectDevice = (setIsMobile: (isMobile: boolean) => void): void => {
    setIsMobile(window.innerWidth <= 768);
};
