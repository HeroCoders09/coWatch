import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Users,
  Shield,
  Zap,
  Video,
  Lock,
  MessageSquare,
  Globe,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Modal } from "./ui/Modal";
import { useRoom } from "../context/RoomContext";

export const LandingPage = () => {
  const { createRoom, joinRoom, connectionStatus } = useRoom();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    roomName: "",
    password: "",
    roomId: "",
  });
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [error, setError] = useState("");

  const isLoading = connectionStatus === "connecting";

  const handleCreateRoom = async () => {
    if (!formData.username || !formData.roomName || !formData.password) {
      setError("Please fill in all fields");
      return;
    }
    if (!captchaVerified) {
      setError("Please verify the CAPTCHA");
      return;
    }
    setError("");
    await createRoom(formData.roomName, formData.password, formData.username);
  };

  const handleJoinRoom = async () => {
    if (!formData.username || !formData.roomId || !formData.password) {
      setError("Please fill in all fields");
      return;
    }
    if (!captchaVerified) {
      setError("Please verify the CAPTCHA");
      return;
    }
    setError("");
    const success = await joinRoom(
      formData.roomId,
      formData.password,
      formData.username
    );
    if (!success) {
      setError("Invalid room ID or password");
    }
  };

  const features = [
    {
      icon: <Play className="w-6 h-6" />,
      title: "Synchronized Playback",
      description:
        "Watch videos perfectly in sync with friends, no matter where they are.",
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Real-time Chat",
      description:
        "Chat with your friends while watching. React and discuss in real-time.",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure Rooms",
      description:
        "Password-protected rooms with CAPTCHA verification for security.",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Zero Lag",
      description:
        "WebSocket technology ensures instant synchronization across all viewers.",
    },
  ];

  const SimpleCaptcha = () => {
    const [answer, setAnswer] = useState("");
    const [num1] = useState(Math.floor(Math.random() * 10));
    const [num2] = useState(Math.floor(Math.random() * 10));

    const verifyCaptcha = () => {
      if (parseInt(answer, 10) === num1 + num2) {
        setCaptchaVerified(true);
      }
    };

    if (captchaVerified) {
      return (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
          <Shield className="w-5 h-5 text-green-500" />
          <span className="text-green-400 text-sm">Verified</span>
        </div>
      );
    }

    return (
      <div className="p-4 bg-dark-800/50 rounded-xl border border-dark-600">
        <div className="flex items-center gap-2 mb-3 text-dark-300 text-sm">
          <Shield className="w-4 h-4" />
          <span>Security Verification</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white font-mono text-lg">
            {num1} + {num2} = ?
          </span>
          <input
            type="number"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="w-20 bg-dark-700 border border-dark-500 rounded-lg px-3 py-2 text-white text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="?"
          />
          <Button variant="secondary" size="sm" onClick={verifyCaptcha}>
            Verify
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-500/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(14,165,233,0.12) 0%, rgba(14,165,233,0) 70%)",
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-20">
          {/* Nav */}
          <nav className="flex items-center justify-between mb-20">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-12 h-12 bg-linear-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center pulse-glow">
                <Video className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-linear-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
                CoWatch
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <Button variant="ghost" onClick={() => setShowJoinModal(true)}>
                Join Room
              </Button>
              <Button
                variant="primary"
                leftIcon={<Sparkles className="w-4 h-4" />}
                onClick={() => setShowCreateModal(true)}
              >
                Create Room
              </Button>
            </motion.div>
          </nav>

          {/* Hero content */}
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 border border-primary-500/20 rounded-full text-primary-400 text-sm mb-8"
            >
              <Globe className="w-4 h-4" />
              Watch together from anywhere in the world
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
            >
              Watch Videos{" "}
              <span className="bg-linear-to-r from-primary-400 via-secondary-400 to-primary-400 bg-clip-text text-transparent animate-gradient big-size[200%_auto]">
                Together
              </span>
              <br />
              In Perfect Sync
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl text-dark-300 mb-12 max-w-2xl mx-auto"
            >
              Create a private room, invite your friends, and enjoy synchronized
              video watching with real-time chat. No distance is too far.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button
                variant="primary"
                size="lg"
                leftIcon={<Play className="w-5 h-5" />}
                onClick={() => setShowCreateModal(true)}
              >
                Create a Room
              </Button>
              <Button
                variant="secondary"
                size="lg"
                leftIcon={<Users className="w-5 h-5" />}
                onClick={() => setShowJoinModal(true)}
              >
                Join Existing Room
              </Button>
            </motion.div>
          </div>

          {/* Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-20 relative"
          >
            <div className="glass rounded-3xl p-4 max-w-5xl mx-auto">
              <div className="aspect-video bg-linear-to-br from-dark-800 to-dark-900 rounded-2xl flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDI1MmIiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZoLTJ2LTRoMnY0em0wLTZoLTJ2LTRoMnY0em0wLTZoLTJWMTJoMnY0em0wLTZoLTJWNmgydjR6TTI2IDM0aC0ydi00aDJ2NHptMC02aC0ydi00aDJ2NHptMC02aC0ydi00aDJ2NHptMC02aC0yVjEyaDJ2NHptMC02aC0yVjZoMnY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
                <div className="text-center animate-float">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-linear-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                    <Play className="w-8 h-8 text-white ml-1" />
                  </div>
                  <p className="text-dark-300">
                    Your video experience starts here
                  </p>
                </div>

                {/* Mock participants */}
                <div className="absolute bottom-4 left-4 flex -space-x-2">
                  {[
                    "from-pink-500 to-rose-500",
                    "from-blue-500 to-cyan-500",
                    "from-green-500 to-emerald-500",
                    "from-purple-500 to-indigo-500",
                  ].map((color, i) => (
                    <div
                      key={i}
                      className={`w-10 h-10 rounded-full bg-linear-to-br ${color} border-2 border-dark-900 flex items-center justify-center text-white text-sm font-bold`}
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                  <div className="w-10 h-10 rounded-full bg-dark-700 border-2 border-dark-900 flex items-center justify-center text-dark-300 text-xs font-medium">
                    +5
                  </div>
                </div>

                {/* Mock chat preview */}
                <div className="absolute bottom-4 right-4 glass-light rounded-xl p-3 w-64">
                  <div className="flex items-start gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-linear-to-br from-blue-500 to-cyan-500" />
                    <div className="flex-1">
                      <p className="text-xs text-dark-300">Alex</p>
                      <p className="text-sm text-white">
                        This movie is amazing! 🎬
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-linear-to-br from-pink-500 to-rose-500" />
                    <div className="flex-1">
                      <p className="text-xs text-dark-300">Sarah</p>
                      <p className="text-sm text-white">I know right! 😍</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything You Need for the Perfect Watch Party
            </h2>
            <p className="text-dark-300 max-w-2xl mx-auto">
              Powerful features designed to make watching videos together
              seamless and enjoyable.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass p-6 rounded-2xl hover:bg-dark-800/80 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-linear-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-dark-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto glass rounded-3xl p-12 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-linear-to-r from-primary-500/10 to-secondary-500/10" />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Watch Together?
            </h2>
            <p className="text-dark-300 mb-8 max-w-xl mx-auto">
              Create your private room in seconds and start watching with
              friends, family, or colleagues.
            </p>
            <Button
              variant="primary"
              size="lg"
              rightIcon={<ChevronRight className="w-5 h-5" />}
              onClick={() => setShowCreateModal(true)}
            >
              Get Started Free
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-dark-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-linear-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
              <Video className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">CoWatch</span>
          </div>
          <p className="text-dark-400 text-sm">
            © 2024 CoWatch. Watch together, stay connected.
          </p>
        </div>
      </footer>

      {/* Create Room Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setError("");
          setCaptchaVerified(false);
        }}
        title="Create a Room"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Your Name"
            placeholder="Enter your display name"
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
            leftIcon={<Users className="w-5 h-5" />}
          />
          <Input
            label="Room Name"
            placeholder="Give your room a name"
            value={formData.roomName}
            onChange={(e) =>
              setFormData({ ...formData, roomName: e.target.value })
            }
            leftIcon={<Video className="w-5 h-5" />}
          />
          <Input
            label="Room Password"
            type="password"
            placeholder="Set a password for your room"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            leftIcon={<Lock className="w-5 h-5" />}
          />

          <SimpleCaptcha />

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-4">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleCreateRoom}
              isLoading={isLoading}
            >
              Create Room
            </Button>
          </div>
        </div>
      </Modal>

      {/* Join Room Modal */}
      <Modal
        isOpen={showJoinModal}
        onClose={() => {
          setShowJoinModal(false);
          setError("");
          setCaptchaVerified(false);
        }}
        title="Join a Room"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Your Name"
            placeholder="Enter your display name"
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
            leftIcon={<Users className="w-5 h-5" />}
          />
          <Input
            label="Room ID"
            placeholder="Enter the room ID"
            value={formData.roomId}
            onChange={(e) =>
              setFormData({ ...formData, roomId: e.target.value.toUpperCase() })
            }
            leftIcon={<Video className="w-5 h-5" />}
          />
          <Input
            label="Room Password"
            type="password"
            placeholder="Enter the room password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            leftIcon={<Lock className="w-5 h-5" />}
          />

          <SimpleCaptcha />

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-4">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => setShowJoinModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleJoinRoom}
              isLoading={isLoading}
            >
              Join Room
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};