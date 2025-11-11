import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useState } from 'react';

const WalletConnect = () => {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [isConnecting, setIsConnecting] = useState(false);

  // Bug5 (轻度): Missing error handling in wallet connect function
  // No try-catch, no error state, no user feedback on connection failures
  const handleCustomConnect = async () => {
    setIsConnecting(true);
    const connector = connectors[0]; // Always use first connector

    // Direct connect call without error handling
    connect({ connector });
    setIsConnecting(false);
  };

  const handleDisconnect = () => {
    disconnect();
  };

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
        <button
          onClick={handleDisconnect}
          className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCustomConnect}
        disabled={isConnecting}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
      <ConnectButton
        chainStatus="icon"
        showBalance={false}
      />
    </div>
  );
};

export default WalletConnect;
