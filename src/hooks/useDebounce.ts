import { useEffect, useState } from "react";

// Debounce hook
export default function useDebounce<T>(value: T, delay: number = 250): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value); // the debounced value

    // Set the debounced value
    useEffect(() => { 
        const handler = setTimeout(() => {
            setDebouncedValue(value); // set the debounced value
        }, delay);

        return () => clearTimeout(handler); // clear the timeout
    }, [value, delay]); // when the value or delay changes

    return debouncedValue;
}