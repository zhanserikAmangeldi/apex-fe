import type {ValidationErrors} from "../types";
import {useState} from "react";

export function useForm<T extends Record<string, string>>(
    initialValues: T,
    validate: (values: T) => ValidationErrors
) {
    const [values, setValues] = useState<T>(initialValues);
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const handleChange = (field: keyof T) => (value: string) => {
        setValues(prev => ({ ...prev, [field]: value }));
        if (touched[field as string]) {
            const newErrors = validate({ ...values, [field]: value });
            setErrors(prev => ({ ...prev, [field]: newErrors[field as string] }));
        }
    };

    const handleBlur = (field: keyof T) => () => {
        setTouched(prev => ({ ...prev, [field]: true }));
        const newErrors = validate(values);
        setErrors(prev => ({ ...prev, [field]: newErrors[field as string] }));
    };

    const validateAll = (): boolean => {
        const newErrors = validate(values);
        setErrors(newErrors);
        setTouched(Object.keys(values).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
        return Object.keys(newErrors).length === 0;
    };

    const reset = () => {
        setValues(initialValues);
        setErrors({});
        setTouched({});
    };

    return { values, errors, touched, handleChange, handleBlur, validateAll, reset };
}
