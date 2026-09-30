Add-Type @"
using System;
using System.Runtime.InteropServices;

public static class CredentialReader {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  public struct CREDENTIAL {
    public uint Flags;
    public uint Type;
    public IntPtr TargetName;
    public IntPtr Comment;
    public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
    public uint CredentialBlobSize;
    public IntPtr CredentialBlob;
    public uint Persist;
    public uint AttributeCount;
    public IntPtr Attributes;
    public IntPtr TargetAlias;
    public IntPtr UserName;
  }

  [DllImport("Advapi32.dll", EntryPoint = "CredReadW", CharSet = CharSet.Unicode, SetLastError = true)]
  private static extern bool CredRead(string target, uint type, uint flags, out IntPtr credentialPtr);

  [DllImport("Advapi32.dll", SetLastError = true)]
  private static extern void CredFree(IntPtr credentialPtr);

  public static string Read(string target) {
    IntPtr pointer;
    if (!CredRead(target, 1, 0, out pointer)) {
      throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error());
    }

    try {
      var credential = Marshal.PtrToStructure<CREDENTIAL>(pointer);
      return Marshal.PtrToStringUni(
        credential.CredentialBlob,
        checked((int)credential.CredentialBlobSize / 2)
      );
    } finally {
      CredFree(pointer);
    }
  }
}
"@

$accessToken = [CredentialReader]::Read("Supabase CLI:supabase")
if ([string]::IsNullOrWhiteSpace($accessToken)) {
  throw "Supabase CLI access token is unavailable."
}

$projectRef = "psqqqhcfmfojrqsvzzzb"
$endpoint = "https://api.supabase.com/v1/projects/$projectRef/config/auth"
$headers = @{
  Authorization = "Bearer $accessToken"
  "Content-Type" = "application/json"
}

$before = Invoke-RestMethod -Method Get -Uri $endpoint -Headers $headers
$body = @{
  site_url = "https://anomalybox.com"
  uri_allow_list = "https://anomalybox.com/auth/callback**"
} | ConvertTo-Json -Compress

$after = Invoke-RestMethod -Method Patch -Uri $endpoint -Headers $headers -Body $body

[pscustomobject]@{
  previous_site_url = $before.site_url
  previous_redirects = $before.uri_allow_list
  site_url = $after.site_url
  redirects = $after.uri_allow_list
  smtp_host_configured = -not [string]::IsNullOrWhiteSpace($after.smtp_host)
  smtp_sender = $after.smtp_admin_email
} | ConvertTo-Json