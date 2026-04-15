import type {ValidationErrors} from "../types";

export const validators = {
    required: (value: string, fieldName: string): string | null => {
        if (!value || !value.trim()) return `${fieldName} is required`;
        return null;
    },

    email: (value: string): string | null => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        return null;
    },

    minLength: (value: string, min: number, fieldName: string): string | null => {
        if (value.length < min) return `${fieldName} must be at least ${min} characters`;
        return null;
    },

    maxLength: (value: string, max: number, fieldName: string): string | null => {
        if (value.length > max) return `${fieldName} must be less than ${max} characters`;
        return null;
    },

    username: (value: string): string | null => {
        if (!/^[a-zA-Z0-9_]+$/.test(value)) {
            return 'Username can only contain letters, numbers, and underscores';
        }
        return null;
    },

    password: (value: string): string | null => {
        if (!/(?=.*[a-z])/.test(value)) return 'Password must contain a lowercase letter';
        if (!/(?=.*[A-Z])/.test(value)) return 'Password must contain an uppercase letter';
        if (!/(?=.*\d)/.test(value)) return 'Password must contain a number';
        return null;
    },

    match: (value: string, compareValue: string, fieldName: string): string | null => {
        if (value !== compareValue) return `${fieldName} do not match`;
        return null;
    },
};

export const validateLoginForm = (data: { login: string; password: string }): ValidationErrors => {
    const errors: ValidationErrors = {};

    const loginError = validators.required(data.login, 'Username or email');
    if (loginError) errors.login = loginError;

    const passwordError = validators.required(data.password, 'Password');
    if (passwordError) errors.password = passwordError;

    return errors;
};

export const validateRegisterForm = (data: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}): ValidationErrors => {
    const errors: ValidationErrors = {};

    let error = validators.required(data.username, 'Username');
    if (error) errors.username = error;
    else {
        error = validators.minLength(data.username, 3, 'Username');
        if (error) errors.username = error;
        else {
            error = validators.maxLength(data.username, 50, 'Username');
            if (error) errors.username = error;
            else {
                error = validators.username(data.username);
                if (error) errors.username = error;
            }
        }
    }

    error = validators.required(data.email, 'Email');
    if (error) errors.email = error;
    else {
        error = validators.email(data.email);
        if (error) errors.email = error;
    }

    error = validators.required(data.password, 'Password');
    if (error) errors.password = error;
    else {
        error = validators.minLength(data.password, 8, 'Password');
        if (error) errors.password = error;
        else {
            error = validators.maxLength(data.password, 32, 'Password');
            if (error) errors.password = error;
        }
    }

    error = validators.required(data.confirmPassword, 'Confirm password');
    if (error) errors.confirmPassword = error;
    else {
        error = validators.match(data.password, data.confirmPassword, 'Passwords');
        if (error) errors.confirmPassword = error;
    }

    return errors;
};

export const validateForgotPasswordForm = (data: { email: string }): ValidationErrors => {
    const errors: ValidationErrors = {};

    let error = validators.required(data.email, 'Email');
    if (error) errors.email = error;
    else {
        error = validators.email(data.email);
        if (error) errors.email = error;
    }

    return errors;
};