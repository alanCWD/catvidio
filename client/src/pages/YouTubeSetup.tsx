import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Copy, Check, AlertCircle, CheckCircle } from "lucide-react";

export default function YouTubeSetup() {
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [authCode, setAuthCode] = useState("");
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<any>(null);

  const checkStatus = async () => {
    try {
      const res = await fetch("/api/youtube/status");
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error("Failed to check status:", err);
    }
  };

  const getAuthUrl = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/youtube/auth-url");
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setAuthUrl(data.authUrl);
      }
    } catch (err) {
      setError("Failed to generate authorization URL");
    }
    setLoading(false);
  };

  const exchangeCode = async () => {
    if (!authCode.trim()) {
      setError("Please enter the authorization code");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/youtube/exchange-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: authCode.trim() })
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setRefreshToken(data.refreshToken);
      }
    } catch (err) {
      setError("Failed to exchange authorization code");
    }
    setLoading(false);
  };

  const copyToken = () => {
    if (refreshToken) {
      navigator.clipboard.writeText(refreshToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Layout>
      <div className="p-4 max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">YouTube API Setup</h1>
        <p className="text-muted-foreground">
          Follow these steps to connect catvid.io to your YouTube channel for automatic video uploads.
        </p>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">1</span>
              Check Current Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={checkStatus} variant="outline" data-testid="button-check-status">
              Check YouTube API Status
            </Button>
            {status && (
              <div className={`p-3 rounded-lg ${status.configured ? 'bg-green-500/10 text-green-600' : 'bg-yellow-500/10 text-yellow-600'}`}>
                {status.configured ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>YouTube API is configured and ready!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>{status.message}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">2</span>
              Generate Authorization URL
            </CardTitle>
            <CardDescription>
              Click the button below to get a Google authorization link. You'll need to sign in with the YouTube account that owns the @catvidioapp channel.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={getAuthUrl} disabled={loading} data-testid="button-generate-url">
              {loading ? "Generating..." : "Generate Auth URL"}
            </Button>
            
            {authUrl && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Click the link below and authorize access:</p>
                <a 
                  href={authUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline break-all"
                  data-testid="link-auth-url"
                >
                  <ExternalLink className="w-4 h-4 shrink-0" />
                  Open Authorization Page
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">3</span>
              Enter Authorization Code
            </CardTitle>
            <CardDescription>
              After authorizing, Google will display a code. Copy and paste it here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Paste authorization code here..."
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
                data-testid="input-auth-code"
              />
              <Button onClick={exchangeCode} disabled={loading || !authCode} data-testid="button-exchange-code">
                {loading ? "Exchanging..." : "Get Token"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {refreshToken && (
          <Card className="border-green-500/50 bg-green-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                Refresh Token Generated!
              </CardTitle>
              <CardDescription>
                Copy this token and add it as a secret named <code className="bg-muted px-1 rounded">YOUTUBE_REFRESH_TOKEN</code>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <pre className="p-3 bg-muted rounded-lg text-xs break-all overflow-x-auto">
                  {refreshToken}
                </pre>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="absolute top-2 right-2"
                  onClick={copyToken}
                  data-testid="button-copy-token"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <div className="text-sm space-y-2">
                <p className="font-medium">Next steps:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Copy the token above</li>
                  <li>Go to the Secrets tab in Replit</li>
                  <li>Add a new secret with key: <code className="bg-muted px-1 rounded">YOUTUBE_REFRESH_TOKEN</code></li>
                  <li>Paste the token as the value</li>
                  <li>Restart the app</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
