import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useSettings() {
    const [businessName, setBusinessName] = useState("CarWash Buddy");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchSettings() {
            try {
                const { data, error } = await supabase
                    .from("app_settings")
                    .select("business_name")
                    .maybeSingle();

                if (!error && data && data.business_name) {
                    setBusinessName(data.business_name);
                }
            } catch (err) {
                console.error("Error fetching settings:", err);
            } finally {
                setIsLoading(false);
            }
        }
        
        fetchSettings();
    }, []);

    return { businessName, isLoading };
}
