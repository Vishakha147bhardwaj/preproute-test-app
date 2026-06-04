import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { login, clearError } from '../app/slices/authSlice';
import logo from '../assets/logo.png';
import illustration from '../assets/illustration.png';

const loginSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error, token } = useAppSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (token) navigate('/dashboard');
  }, [token, navigate]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const onSubmit = (data: LoginFormData) => {
    dispatch(login(data));
  };

  return (
    <div className="min-h-screen bg-[#EEF2FF] flex items-center justify-center p-4">
      <div className="w-full max-w-5xl flex rounded-2xl overflow-hidden shadow-lg min-h-[600px]">

        {/* Left side — illustration */}
        <div className="hidden md:flex w-[55%] bg-[#EEF2FF] items-center justify-center relative">
          {/* Decorative symbols */}
          <span className="absolute top-[35%] left-[15%] text-gray-400 text-2xl select-none">+</span>
          <span className="absolute top-[32%] right-[20%] text-gray-300 text-lg select-none">○</span>
          <span className="absolute bottom-[32%] right-[15%] text-gray-400 text-2xl select-none">+</span>

          <img
            src={illustration}
            alt="Preproute illustration"
            className="w-[75%] object-contain"
          />
        </div>

        {/* Right side — form */}
        <div className="w-full md:w-[45%] bg-white flex flex-col justify-center px-10 py-12">

          {/* Logo */}
          <div className="mb-8">
            <img src={logo} alt="Preproute" className="h-8 object-contain" />
          </div>

          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Login</h1>
          <p className="text-sm text-gray-500 mb-8">
            Use your company provided Login credentials
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* User ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                User ID
              </label>
              <input
                {...register('userId')}
                type="text"
                placeholder="Enter User ID"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition placeholder:text-gray-400"
              />
              {errors.userId && (
                <p className="text-red-500 text-xs mt-1">{errors.userId.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                placeholder="Enter Password"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition placeholder:text-gray-400"
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Forgot password */}
            <div className="text-left">
              <button
                type="button"
                className="text-sm text-blue-500 hover:underline"
              >
                Forgot password?
              </button>
            </div>

            {/* API error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-3 rounded-lg transition text-sm"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;