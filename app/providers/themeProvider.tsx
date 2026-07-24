"use client";
import { useEffect } from "react";
import { useThemeStore } from "../store/themeStore";

export default function ThemeProvider() {
    const initTheme = useThemeStore((s) => s.initTheme);
    useEffect(() => {
        initTheme();
    }, []);
    return null;
}