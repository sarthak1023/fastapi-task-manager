import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import api from "../api/axios";
import Tilt from "react-parallax-tilt";
import { MailCheck } from "lucide-react";

function Verify() {
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState(location.state?.email || "");
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-indigo-50 relative overflow-hidden">

            <div className="absolute top-10 left-10 w-40 h-40 bg-indigo-200 rounded-full blur-3xl opacity-40"></div>
            <div className="absolute bottom-10 right-10 w-56 h-56 bg-purple-200 rounded-full blur-3xl opacity-40"></div>

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
                    <div className="flex justify-center mb-4">
                        <div className="bg-indigo-100 p-3 rounded-full">
                            <MailCheck className="text-indigo-600" size={24} />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
                        Verify your email
                    </h2>
                    <p className="text-sm text-gray-500 mb-6 text-center">
                        We sent a 6-digit code to your email. Enter it below.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">

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

                    <p className="text-sm text-gray-600 mt-4 text-center">
                        Already verified? <Link to="/login" className="text-indigo-600 hover:underline">Login</Link>
                    </p>
                </div>
            </Tilt>
        </div>
    );
}

export default Verify;