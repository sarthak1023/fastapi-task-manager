import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { Link } from "react-router-dom";
import Tilt from "react-parallax-tilt";
import { CheckSquare } from "lucide-react";

function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const successMessage = location.state?.message;

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");

        if (!email.trim() || !password.trim()) {
            setError("Please fill in all fields.");
            return;
        }

        if (!email.includes("@")) {
            setError("Please enter a valid email.");
            return;
        }

        setIsSubmitting(true);

        try {
            const formData = new URLSearchParams();
            formData.append("username", email);
            formData.append("password", password);

            const response = await api.post("/login", formData, {
                headers: { "Content-Type": "application/x-www-form-urlencoded" }
            });

            const token = response.data.access_token;
            login(token);
            navigate("/dashboard");

        } catch (error) {
            console.error("Login failed:", error);
            setError("Invalid email or password.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">

            {/* Floating background shapes for depth */}
            <div className="absolute top-10 left-10 w-40 h-40 bg-slate-100 rounded-full blur-3xl opacity-5"></div>
            <div className="absolute bottom-10 right-10 w-56 h-56 bg-slate-100 rounded-full blur-3xl opacity-5"></div>

            <Tilt
                tiltMaxAngleX={6}
                tiltMaxAngleY={6}
                glareEnable={true}
                glareMaxOpacity={0.2}
                glareColor="#ffffff"
                glarePosition="all"
                transitionSpeed={1500}
                className="relative z-10"
            >
                <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-2xl">
                    <div className="flex flex-col items-center mb-8">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="bg-indigo-600 p-2 rounded-lg">
                                <CheckSquare className="text-white" size={20} />
                            </div>
                            <span className="text-xl font-bold text-gray-800">TaskMaster</span>
                        </div>
                        <p className="text-xs text-gray-400 font-medium">Stay organized, stay focused</p>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                        Log in
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">

                        {successMessage && (
                            <p className="text-green-600 text-sm bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                                {successMessage}
                            </p>
                        )}

                        {error && (
                            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                {error}
                            </p>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-indigo-300 transition shadow-lg shadow-indigo-200"
                        >
                            {isSubmitting ? "Logging in..." : "Login"}
                        </button>

                    </form>

                    <p className="text-sm text-gray-600 mt-4 text-center">
                        Don't have an account? <Link to="/signup" className="text-indigo-600 hover:underline">Sign up</Link>
                    </p>
                </div>
            </Tilt>
        </div>
    );
}

export default Login;