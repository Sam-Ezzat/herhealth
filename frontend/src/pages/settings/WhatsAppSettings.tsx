import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { FiCheck, FiAlertCircle, FiSettings, FiMessageSquare } from 'react-icons/fi';

interface WhatsAppConfig {
  isConfigured: boolean;
  phoneId: string;
  apiUrl: string;
  mode: 'api' | 'web';
  webStatus?: {
    isReady: boolean;
    isInitializing: boolean;
    hasQrCode: boolean;
  };
}

interface WebClientInfo {
  phoneNumber: string;
  name: string;
  platform: string;
}

const WhatsAppSettings = () => {
  const [config, setConfig] = useState<WhatsAppConfig>({
    isConfigured: false,
    phoneId: '',
    apiUrl: 'https://graph.facebook.com/v17.0',
    mode: 'api'
  });
  const [accessToken, setAccessToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [webClientInfo, setWebClientInfo] = useState<WebClientInfo | null>(null);
  const [changingMode, setChangingMode] = useState(false);

  useEffect(() => {
    loadConfig();
    // Poll for QR code and status updates
    const interval = setInterval(() => {
      if (config.mode === 'web') {
        loadQRCode();
        loadWebClientInfo();
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [config.mode]);

  const loadConfig = async () => {
    try {
      const response = await api.get<{ success: boolean; data: WhatsAppConfig }>('/whatsapp/config');
      const data = (response as any).data || response;
      setConfig(data);
      
      // Load web info if in web mode
      if (data.mode === 'web') {
        loadQRCode();
        loadWebClientInfo();
      }
    } catch (error) {
      console.error('Failed to load config');
    }
  };

  const loadQRCode = async () => {
    try {
      const response = await api.get<{ success: boolean; data: { qrCode: string | null; isReady: boolean } }>('/whatsapp/web/qr');
      const data = (response as any).data || response;
      setQrCode(data.qrCode);
      
      // Update config with ready status
      if (data.isReady) {
        setConfig(prev => ({
          ...prev,
          webStatus: { ...prev.webStatus!, isReady: true }
        }));
      }
    } catch (error) {
      console.error('Failed to load QR code');
    }
  };

  const loadWebClientInfo = async () => {
    try {
      const response = await api.get<{ success: boolean; data: WebClientInfo | null }>('/whatsapp/web/info');
      const data = (response as any).data || response;
      setWebClientInfo(data);
    } catch (error) {
      // Silent fail - client might not be connected yet
    }
  };

  const handleSave = async () => {
    if (!config.phoneId || !accessToken) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      await api.post('/whatsapp/config', {
        phone_id: config.phoneId,
        access_token: accessToken,
        api_url: config.apiUrl
      });
      toast.success('WhatsApp configuration saved successfully');
      setAccessToken('');
      loadConfig();
    } catch (error: any) {
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleModeChange = async (newMode: 'api' | 'web') => {
    try {
      setChangingMode(true);
      await api.post('/whatsapp/config/mode', { mode: newMode });
      setConfig(prev => ({ ...prev, mode: newMode }));
      toast.success(`Switched to ${newMode === 'api' ? 'Business API' : 'WhatsApp Web'} mode`);
      
      // Initialize WhatsApp Web if switching to web mode
      if (newMode === 'web') {
        await handleInitializeWeb();
      }
    } catch (error: any) {
      toast.error('Failed to change mode');
    } finally {
      setChangingMode(false);
    }
  };

  const handleInitializeWeb = async () => {
    try {
      await api.post('/whatsapp/web/initialize');
      toast.info('Initializing WhatsApp Web... Please scan QR code');
      loadQRCode();
    } catch (error: any) {
      toast.error('Failed to initialize WhatsApp Web');
    }
  };

  const handleDisconnectWeb = async () => {
    try {
      await api.post('/whatsapp/web/disconnect');
      toast.success('WhatsApp Web disconnected');
      setQrCode(null);
      setWebClientInfo(null);
      loadConfig();
    } catch (error: any) {
      toast.error('Failed to disconnect');
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">WhatsApp Settings</h1>
          <p className="text-gray-600 mt-2">Configure WhatsApp for automated notifications</p>
        </div>

        {/* Mode Selection */}
        <div className="mb-6 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">WhatsApp Mode</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => handleModeChange('api')}
              disabled={changingMode}
              className={`p-4 rounded-lg border-2 transition-all ${
                config.mode === 'api'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <h4 className="font-semibold text-gray-800">Business API</h4>
                  <p className="text-sm text-gray-600 mt-1">Official Meta Business API</p>
                  <p className="text-xs text-gray-500 mt-2">✓ Production ready</p>
                  <p className="text-xs text-gray-500">✓ Reliable & scalable</p>
                </div>
                {config.mode === 'api' && <FiCheck className="text-blue-600" size={24} />}
              </div>
            </button>

            <button
              onClick={() => handleModeChange('web')}
              disabled={changingMode}
              className={`p-4 rounded-lg border-2 transition-all ${
                config.mode === 'web'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <h4 className="font-semibold text-gray-800">WhatsApp Web</h4>
                  <p className="text-sm text-gray-600 mt-1">Connect via web.whatsapp.com</p>
                  <p className="text-xs text-gray-500 mt-2">✓ Easy setup (scan QR)</p>
                  <p className="text-xs text-gray-500">✓ Free (testing only)</p>
                </div>
                {config.mode === 'web' && <FiCheck className="text-green-600" size={24} />}
              </div>
            </button>
          </div>
        </div>

        {/* Status Card */}
        <div className={`mb-6 p-4 rounded-lg border-2 ${
          config.mode === 'api'
            ? config.isConfigured 
              ? 'bg-green-50 border-green-200' 
              : 'bg-yellow-50 border-yellow-200'
            : config.webStatus?.isReady
              ? 'bg-green-50 border-green-200'
              : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center gap-3">
            {(config.mode === 'api' && config.isConfigured) || (config.mode === 'web' && config.webStatus?.isReady) ? (
              <>
                <FiCheck className="text-green-600" size={24} />
                <div>
                  <h3 className="font-semibold text-green-800">
                    {config.mode === 'api' ? 'WhatsApp API Configured' : 'WhatsApp Web Connected'}
                  </h3>
                  <p className="text-sm text-green-700">
                    {webClientInfo ? `Connected as: ${webClientInfo.name} (${webClientInfo.phoneNumber})` : 'Automated notifications are enabled'}
                  </p>
                </div>
              </>
            ) : (
              <>
                <FiAlertCircle className="text-yellow-600" size={24} />
                <div>
                  <h3 className="font-semibold text-yellow-800">
                    {config.mode === 'api' ? 'WhatsApp API Not Configured' : 'WhatsApp Web Not Connected'}
                  </h3>
                  <p className="text-sm text-yellow-700">
                    {config.mode === 'api' 
                      ? 'Configure API credentials to enable automated notifications'
                      : 'Scan QR code to connect WhatsApp Web'
                    }
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* WhatsApp Web QR Code */}
        {config.mode === 'web' && (
          <div className="mb-6 bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">WhatsApp Web Connection</h3>
              {config.webStatus?.isReady && (
                <button
                  onClick={handleDisconnectWeb}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Disconnect
                </button>
              )}
            </div>

            {config.webStatus?.isReady ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <FiCheck className="text-green-600" size={24} />
                  <div>
                    <h4 className="font-semibold text-green-800">Connected Successfully!</h4>
                    {webClientInfo && (
                      <p className="text-sm text-green-700 mt-1">
                        {webClientInfo.name} • {webClientInfo.phoneNumber} • {webClientInfo.platform}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : qrCode ? (
              <div className="text-center">
                <p className="text-gray-700 mb-4">Scan this QR code with WhatsApp on your phone:</p>
                <div className="inline-block bg-white p-4 rounded-lg shadow">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCode)}`} alt="QR Code" className="w-64 h-64" />
                </div>
                <p className="text-sm text-gray-600 mt-4">
                  Open WhatsApp → Settings → Linked Devices → Link a Device
                </p>
              </div>
            ) : config.webStatus?.isInitializing ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Initializing WhatsApp Web...</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <button
                  onClick={handleInitializeWeb}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Connect WhatsApp Web
                </button>
              </div>
            )}
          </div>
        )}

        {/* Setup Instructions */}
        {config.mode === 'api' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <FiMessageSquare />
            How to Get WhatsApp Business API Credentials
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>Go to <a href="https://business.facebook.com" target="_blank" rel="noopener noreferrer" className="underline">Meta Business Suite</a></li>
            <li>Create or select your Business Account</li>
            <li>Navigate to WhatsApp &gt; API Setup</li>
            <li>Add a phone number or use the test number</li>
            <li>Generate a Permanent Access Token (Admin permissions)</li>
            <li>Copy your Phone Number ID and Access Token</li>
            <li>Paste them in the form below</li>
          </ol>
          <div className="mt-4 p-3 bg-blue-100 rounded text-xs text-blue-900">
            <strong>Note:</strong> The test number can only send messages to 5 pre-registered numbers. 
            For production, you'll need to complete Business Verification and add a payment method.
          </div>
        </div>
        )}

        {/* Configuration Form - Only show for API mode */}
        {config.mode === 'api' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiSettings />
            API Configuration
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API URL
              </label>
              <input
                type="text"
                value={config.apiUrl}
                onChange={(e) => setConfig({ ...config, apiUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://graph.facebook.com/v17.0"
              />
              <p className="text-xs text-gray-500 mt-1">Default: https://graph.facebook.com/v17.0</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={config.phoneId}
                onChange={(e) => setConfig({ ...config, phoneId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your WhatsApp Phone Number ID"
              />
              <p className="text-xs text-gray-500 mt-1">
                Found in Meta Business Suite &gt; WhatsApp &gt; API Setup
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Access Token <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your Permanent Access Token"
              />
              <p className="text-xs text-gray-500 mt-1">
                Generate in Meta Business Suite &gt; WhatsApp &gt; API Setup &gt; Permanent Token
              </p>
            </div>

            <div className="pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 font-medium"
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </div>
        )}

        {/* Message Templates Info */}
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Message Templates</h3>
          <p className="text-sm text-gray-600 mb-3">
            After configuring the API, manage your message templates in the WhatsApp Templates section.
            Templates can be customized for different appointment events:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            <li>Appointment Scheduled - Sent when a new appointment is created</li>
            <li>Appointment Confirmed - Sent when appointment is confirmed</li>
            <li>Appointment Rescheduled - Sent when appointment time is changed</li>
            <li>Appointment Cancelled - Sent when appointment is cancelled</li>
            <li>Appointment Reminder - Sent 24 hours before appointment</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppSettings;
