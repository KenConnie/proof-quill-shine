import { ConnectButton } from '@rainbow-me/rainbowkit';

const WalletConnect = () => {
  return (
    <ConnectButton 
      chainStatus="icon"
      showBalance={false}
    />
  );
};

export default WalletConnect;
