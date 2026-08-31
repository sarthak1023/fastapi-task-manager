import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import api from "../api/axios";
import Tilt from "react-parallax-tilt";
import { CheckSquare } from "lucide-react";

function Verify() {
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState(location.state?.email || "");
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [resendMessage, setResendMessage] = useState("");

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
            await api.post("/verify", { email, code });
            navigate("/login", { state: { message: "Email verified! You can now log in." } });

        } catch (error) {
            console.error("Verification failed:", error);

            if (error.response && error.response.data && error.response.data.detail) {
                setError(error.response.data.detail);
            } else {
                setError("Verification failed. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleResend() {
        setError("");
        setResendMessage("");

        if (!email.trim()) {
            setError("Enter your email first.");
            return;
        }

        setIsResending(true);

        try {
            await api.post("/resend-code", { email });
            setResendMessage("A new code has been sent to your email.");

        } catch (error) {
            console.error("Resend failed:", error);

            if (error.response && error.response.data && error.response.data.detail) {
                setError(error.response.data.detail);
            } else {
                setError("Could not resend code. Please try again.");
            }
        } finally {
            setIsResending(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">

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

                    <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
                        Verify your email
                    </h2>
                    <p className="text-sm text-gray-500 mb-6 text-center">
                        We sent a 6-digit code to your email. Enter it below.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">

                        {resendMessage && (
                            <p className="text-green-600 text-sm bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                                {resendMessage}
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
                                placeholder="Your email"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="Enter 6-digit code"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-indigo-300 transition shadow-lg shadow-indigo-200"
                        >
                            {isSubmitting ? "Verifying..." : "Verify"}
                        </button>

                    </form>

                    <button
                        onClick={handleResend}
                        disabled={isResending}
                        className="w-full text-sm text-indigo-600 hover:text-indigo-800 hover:underline mt-4 disabled:text-gray-400 disabled:no-underline"
                    >
                        {isResending ? "Resending..." : "Didn't get a code? Resend"}
                    </button>

                    <p className="text-sm text-gray-600 mt-4 text-center">
                        Already verified? <Link to="/login" className="text-indigo-600 hover:underline">Login</Link>
                    </p>
                </div>
            </Tilt>
        </div>
    );
}

export default Verify;