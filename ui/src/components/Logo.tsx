import logo from "@/assets/logo.png";

const Logo = () => {
  return (
    <div className="flex items-center gap-3">
      <img 
        src={logo} 
        alt="TravelProof Logo" 
        className="h-10 w-10 rounded-lg shadow-lg" 
      />
      <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
        TravelProof
      </span>
    </div>
  );
};

export default Logo;
