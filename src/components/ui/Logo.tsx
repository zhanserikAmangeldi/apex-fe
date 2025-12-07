export const Logo: React.FC<{ onClick?: () => void }> = ({ onClick }) => (
    <div className="flex items-center gap-3 cursor-pointer" onClick={onClick}>
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <img
                src="/src/assets/logo.png"
                alt="Apex Logo"
                className="w-10 h-10 object-contain"
            />
        </div>
        <span className="text-white text-2xl font-semibold">Apex</span>
    </div>
);
