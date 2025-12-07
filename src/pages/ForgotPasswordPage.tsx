import {useState} from "react";
import {useForm} from "../hooks/UseForm.tsx";
import {validateForgotPasswordForm} from "../utils/validation.ts";
import {api} from "../services/api.ts";
import type {ApiError} from "../types";
import {AuthLayout} from "../components/layout/AuthLayout.tsx";
import {Alert} from "../components/ui/Allert.tsx";
import {Input} from "../components/ui/Input.tsx";
import {GradientButton} from "../components/ui/Button.tsx";
import {Footer} from "../components/ui/Footer.tsx";

export const ForgotPasswordPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const { values, errors, handleChange, handleBlur, validateAll } = useForm(
        { email: '' },
        validateForgotPasswordForm
    );

    const navigate = (path: string) => {
        window.history.pushState({}, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
    };

    const handleSubmit = async () => {
        if (!validateAll()) return;

        setLoading(true);
        setApiError(null);

        try {
            await api.forgotPassword({ email: values.email });
            setSent(true);
        } catch (e) {
            const err = e as ApiError;
            setApiError(err.message || err.error || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="No Worries.!!"
            buttonText="Take me back.!"
            onButtonClick={() => navigate('/login')}
            ellipseColors={{
                top: "linear-gradient(180deg, #61003A 0%, #2D0A30 100%)",
                bottom: "linear-gradient(180deg, #61004B 0%, #220A30 100%)"
            }}
        >
            <div className="space-y-6">
                <div>
                    <h2 className="text-3xl font-semibold text-white">Forgot Password ?</h2>
                    <p className="text-white/70 text-sm">Please enter your email</p>
                </div>

                {apiError && <Alert type="error" message={apiError} onClose={() => setApiError(null)} />}

                {sent ? (
                    <div className="py-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="text-white mb-2">Check your email!</p>
                        <p className="text-white/60 text-sm">We've sent password reset instructions to {values.email}</p>
                    </div>
                ) : (
                    <>
                        <Input
                            placeholder="example@mail.com"
                            type="email"
                            value={values.email}
                            onChange={handleChange('email')}
                            onBlur={handleBlur('email')}
                            error={errors.email}
                        />
                        <GradientButton variant="pink" className="w-full" onClick={handleSubmit} loading={loading}>Reset Password</GradientButton>
                    </>
                )}

                <p className="text-center text-white/80 text-sm">
                    Don't have an account ?{' '}
                    <span className="cursor-pointer hover:text-white font-medium transition-colors"
                          onClick={() => navigate('/register')}>
            Signup
          </span>
                </p>

                <Footer />
            </div>
        </AuthLayout>
    );
};
