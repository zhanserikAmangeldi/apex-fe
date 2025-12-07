import {validateLoginForm} from "../utils/validation.ts";
import {useState} from "react";
import {useForm} from "../hooks/UseForm.tsx";
import {AuthLayout} from "../components/layout/AuthLayout.tsx";
import {Alert} from "../components/ui/Allert.tsx";
import {Input} from "../components/ui/Input.tsx";
import {GradientButton} from "../components/ui/Button.tsx";
import {SocialLogin} from "../components/ui/SocialLogin.tsx";
import {Footer} from "../components/ui/Footer.tsx";
import {useAuth} from "../hooks/UseAuth.tsx";

export const LoginPage: React.FC = () => {
    const { login: authLogin, isLoading, error, clearError } = useAuth();
    const [remember, setRemember] = useState(false);

    const { values, errors, handleChange, handleBlur, validateAll } = useForm(
        { login: '', password: '' },
        validateLoginForm
    );

    const navigate = (path: string) => {
        window.history.pushState({}, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
    };

    const handleSubmit = async () => {
        if (!validateAll()) return;

        try {
            await authLogin(values);
            navigate('/dashboard');
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <AuthLayout
            title="Welcome Back .!"
            buttonText="Skip the lag ?"
            onButtonClick={() => navigate('/')}
            ellipseColors={{
                top: "linear-gradient(180deg, #530061 0%, #0D0A30 100%)",
                bottom: "linear-gradient(180deg, #300061 0%, #0A1030 100%)"
            }}
        >
            <div className="space-y-6">
                <div>
                    <h2 className="text-3xl font-semibold text-white">Login</h2>
                    <p className="text-white/70 text-sm">Glad you're back.!</p>
                </div>

                {error && <Alert type="error" message={error} onClose={clearError} />}

                <div className="space-y-5">
                    <Input
                        placeholder="Username"
                        value={values.login}
                        onChange={handleChange('login')}
                        onBlur={handleBlur('login')}
                        error={errors.login}
                    />
                    <div className="space-y-3">
                        <Input
                            placeholder="Password"
                            type="password"
                            value={values.password}
                            onChange={handleChange('password')}
                            onBlur={handleBlur('password')}
                            error={errors.password}
                        />
                        <label className="flex items-center gap-2 cursor-pointer">
                            <div
                                className={`w-4 h-4 rounded border transition-all ${remember ? 'bg-gradient-to-b from-blue-400 to-purple-400 border-transparent' : 'border-white/50'}`}
                                onClick={() => setRemember(!remember)}
                            />
                            <span className="text-white/80 text-sm">Remember me</span>
                        </label>
                    </div>
                </div>

                <div className="space-y-3">
                    <GradientButton className="w-full" onClick={handleSubmit} loading={isLoading}>Login</GradientButton>
                    <p className="text-center text-white/80 text-sm cursor-pointer hover:text-white transition-colors"
                       onClick={() => navigate('/forgot-password')}>
                        Forgot password ?
                    </p>
                </div>

                <SocialLogin />

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