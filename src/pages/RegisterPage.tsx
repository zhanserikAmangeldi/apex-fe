import {useForm} from "../hooks/UseForm.tsx";
import {validateRegisterForm} from "../utils/validation.ts";
import {AuthLayout} from "../components/layout/AuthLayout.tsx";
import {Alert} from "../components/ui/Allert.tsx";
import {Input} from "../components/ui/Input.tsx";
import {GradientButton} from "../components/ui/Button.tsx";
import {SocialLogin} from "../components/ui/SocialLogin.tsx";
import {Footer} from "../components/ui/Footer.tsx";
import {useAuth} from "../hooks/UseAuth.tsx";

export const RegisterPage: React.FC = () => {
    const { register: authRegister, isLoading, error, clearError } = useAuth();

    const { values, errors, handleChange, handleBlur, validateAll } = useForm(
        { username: '', email: '', password: '', confirmPassword: '' },
        validateRegisterForm
    );

    const navigate = (path: string) => {
        window.history.pushState({}, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
    };

    const handleSubmit = async () => {
        if (!validateAll()) return;

        try {
            await authRegister({
                username: values.username,
                email: values.email,
                password: values.password,
            });
            navigate('/dashboard');
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <AuthLayout
            title="Roll the Carpet.!"
            buttonText="Skip the lag ?"
            onButtonClick={() => navigate('/login')}
            ellipseColors={{
                top: "linear-gradient(180deg, #190061 0%, #0A1B30 100%)",
                bottom: "linear-gradient(180deg, #000F61 0%, #0A1730 100%)"
            }}
        >
            <div className="space-y-5">
                <div>
                    <h2 className="text-3xl font-semibold text-white">Signup</h2>
                    <p className="text-white/70 text-sm">Just some details to get you in.!</p>
                </div>

                {error && <Alert type="error" message={error} onClose={clearError} />}

                <div className="space-y-4">
                    <Input
                        placeholder="Username"
                        value={values.username}
                        onChange={handleChange('username')}
                        onBlur={handleBlur('username')}
                        error={errors.username}
                    />
                    <Input
                        placeholder="Email / Phone"
                        type="email"
                        value={values.email}
                        onChange={handleChange('email')}
                        onBlur={handleBlur('email')}
                        error={errors.email}
                    />
                    <Input
                        placeholder="Password"
                        type="password"
                        value={values.password}
                        onChange={handleChange('password')}
                        onBlur={handleBlur('password')}
                        error={errors.password}
                    />
                    <Input
                        placeholder="Confirm Password"
                        type="password"
                        value={values.confirmPassword}
                        onChange={handleChange('confirmPassword')}
                        onBlur={handleBlur('confirmPassword')}
                        error={errors.confirmPassword}
                    />
                </div>

                <GradientButton variant="blue" className="w-full" onClick={handleSubmit} loading={isLoading}>Signup</GradientButton>

                <SocialLogin />

                <p className="text-center text-white/80 text-sm">
                    Already Registered?{' '}
                    <span className="cursor-pointer hover:text-white font-medium transition-colors"
                          onClick={() => navigate('/login')}>
            Login
          </span>
                </p>

                <Footer />
            </div>
        </AuthLayout>
    );
};