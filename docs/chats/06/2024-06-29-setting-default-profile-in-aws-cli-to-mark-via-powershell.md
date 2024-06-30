---
original file name: Codeium Chat - GBBlUGahlJyRxBcuK9kkzULoPm6Vw2xC.md
summary: The user was having trouble setting the default profile for their AWS CLI. They had removed a profile from `~/.aws/credentials` and `~/.aws/config`, but it still appeared when running `aws configure list`. I guided them on checking and clearing environment variables like `AWS_PROFILE`, and also explained how to set the default profile to `mark` using environment variables in PowerShell.

The user attempted to set the profile to `mark` using `aws configure set`, but it didn't reflect the change in the output of `aws configure list`. I clarified that setting the default profile globally this way wasn't directly supported and explained how the default profile is determined either by the `AWS_PROFILE` environment variable or by the profile named `[default]` in AWS configuration files.

Even after trying to set the default profile to `mark`, the user still saw `<not set>` for the profile in the output. I further explained that this was expected behavior if the `AWS_PROFILE` environment variable wasn't set. I provided guidance on how to set `mark` as the current profile for the session using PowerShell and verified that the profile was correctly set by running `aws configure list`.

The user was able to resolve the issue by setting the `AWS_PROFILE` environment variable to `mark`.
date: 2024-06-29T09:20
---

# Codeium Chat Conversation

Note: _This is purely the output of the chat conversation and does not contain any raw data, codebase snippets, etc. used to generate the output._

**User** _at 9:20 am, Jun 29, 2024_

I am having trouble setting my AWS ClI default profile. I have removed a profile from `$HOME/.aws/credentials` and `$HOME/.aws/config` but it still shows up when I run `aws configure list`

---

**Codeium** _at 9:21 am, Jun 29, 2024_

If you've removed a profile from both `$HOME/.aws/credentials` and `$HOME/.aws/config` but it still appears when you run `aws configure list`, there might be an environment variable overriding your default profile configuration. The AWS CLI respects environment variables such as `AWS_PROFILE` and `AWS_DEFAULT_PROFILE`, which could be causing this issue.

To diagnose and resolve the issue, follow these steps:

1. **Check for Environment Variables**: First, check if there are any environment variables set for `AWS_PROFILE` or `AWS_DEFAULT_PROFILE`. You can do this by running:
    ```powershell
    Get-ChildItem Env:AWS_PROFILE
    Get-ChildItem Env:AWS_DEFAULT_PROFILE
    ```

2. **Clear the Environment Variables (If Set)**: If the above commands return any values, you can clear them using the following commands. This will remove the override, allowing AWS CLI to use the profile specified in the credentials or config file.
    ```powershell
    Remove-Item Env:AWS_PROFILE
    Remove-Item Env:AWS_DEFAULT_PROFILE
    ```

3. **Verify the Removal**: After clearing the environment variables, verify that they are no longer set by running the commands from step 1 again. They should not return any values this time.

4. **Retry `aws configure list`**: Finally, run `aws configure list` again to check if the correct default profile is now being used.

Remember, if you're using PowerShell scripts or functions to manage AWS CLI profiles (like the one in `c:\Users\xgenx\OneDrive\Documents2\PowerShell\Microsoft.PowerShell_profile.ps1`), ensure they're not automatically setting these environment variables on startup. You can check your PowerShell profile scripts for any lines that set `AWS_PROFILE` or `AWS_DEFAULT_PROFILE` and adjust them accordingly.

For instance, in your provided script, the profile is being set based on a selection mechanism. Ensure that this mechanism correctly reflects the removal of the profile and does not inadvertently reset the environment variables to an outdated or removed profile.

---

**User** _at 9:27 am, Jun 29, 2024_

Ok, that seems to have worked. Now how do I set it to `mark`?

---

**Codeium** _at 9:27 am, Jun 29, 2024_

To set your AWS CLI default profile to `mark`, you can either set an environment variable or configure it directly in your AWS CLI configuration. Given your preference for PowerShell commands, I'll guide you through setting it via an environment variable in PowerShell.

### Setting the AWS CLI Default Profile Using an Environment Variable

You can set the `AWS_PROFILE` environment variable to `mark`. This environment variable tells the AWS CLI which profile to use for commands.

1. **Set Environment Variable for the Current Session**:
    - To set the `AWS_PROFILE` environment variable for the current PowerShell session, which will only last until the PowerShell window is closed, you can use:
      ```powershell
      $env:AWS_PROFILE = "mark"
      ```
    - This change will take effect immediately but will not persist across sessions.

2. **Set Environment Variable Persistently**:
    - To set the `AWS_PROFILE` environment variable persistently across all PowerShell sessions, you can use:
      ```powershell
      [System.Environment]::SetEnvironmentVariable('AWS_PROFILE', 'mark', [System.EnvironmentVariableTarget]::User)
      ```
    - This command sets the `AWS_PROFILE` environment variable for the current user, making it persist across all sessions. You may need to restart your PowerShell session or IDE (like Visual Studio Code) for the changes to take effect.

### Verifying the Change

After setting the environment variable, you can verify that it's correctly pointing to the `mark` profile by running:

```powershell
aws configure list
```

This command should show the profile as `mark` under the `profile` field. If it does, you have successfully set your AWS CLI to use the `mark` profile by default.

### Note

Setting the `AWS_PROFILE` environment variable overrides the default profile set in the AWS configuration files (`~/.aws/config` and `~/.aws/credentials`). If you decide later to use a different profile by default, you can change the environment variable's value to the new profile name or clear it to revert to using the profile specified in the configuration files.

---

**User** _at 9:29 am, Jun 29, 2024_

I don't seem to be able to set the profile setting displayed here:

```powershell
[09:28:36]❯ aws configure set profile mark     
handex-react\cdk on  master [$✘!+?⇡] is 📦 v0.1.0 via  v20.12.1 on ☁️ (us-east-1) 
🕐[09:28:51]❯ aws configure list
   Name          Value       Type  Location
   ----          -----       ----  --------
  profile        <not set>       None  None
access_key   ****************7Z7Q shared-credentials-file
secret_key   ****************zIMT shared-credentials-file
  region        us-east-1   config-file  ~/.aws/config
```

---

**Codeium** _at 9:30 am, Jun 29, 2024_

It looks like there's a slight misunderstanding in the use of the `aws configure set` command. The syntax you provided attempts to set a configuration setting named "profile mark", which isn't a valid configuration key by itself.

To set the default profile globally using `aws configure set`, you need to specifically target properties within the profile. However, setting the AWS CLI default profile globally via `aws configure` commands isn't directly supported in the way you might expect (e.g., there's no single "default profile" setting you can change directly with `aws configure set`).

Instead, the default profile is determined by:

1. **The `AWS_PROFILE` environment variable.** (As previously discussed)
2. **The profile named `[default]` in your AWS configuration files.**

If you want to use the profile named `mark` as your default for CLI operations without setting the `AWS_PROFILE` environment variable, you would typically rename the `[mark]` profile to `[default]` in both your `~/.aws/credentials` and `~/.aws/config` files, or ensure your commands and scripts explicitly reference the `mark` profile.

However, you can set specific configuration values for the `mark` profile using the `aws configure set` command by specifying the profile in the command itself. For example, to set the region for the `mark` profile, you would use:

```powershell
aws configure set region us-east-1 --profile mark
```

This command sets the `region` for the `mark` profile, but it doesn't make `mark` the default profile. The default profile is either the one named `[default]` in your AWS configuration files or the one specified by the `AWS_PROFILE` environment variable.

### To summarize:

- **To use `mark` as your default profile for the AWS CLI**, you should set the `AWS_PROFILE` environment variable to `mark` in your PowerShell session, or configure your PowerShell profile script to set it automatically on startup.
- **For persistent changes across sessions**, use the `[System.Environment]::SetEnvironmentVariable` method mentioned earlier to set `AWS_PROFILE` to `mark` for the user or system.
- **To configure settings for the `mark` profile**, use `aws configure set` with the `--profile mark` option for each setting you wish to configure.

---

**User** _at 9:32 am, Jun 29, 2024_

That still does not set the profile value displayed in the table. It still says `<not set>`.

```powershell
[09:30:44]❯ aws configure set region us-east-1 --profile mark
handex-react\cdk on  master [$✘!+?⇡] is 📦 v0.1.0 via  v20.12.1 on ☁️ (us-east-1) 
🕐[09:30:51]❯ aws configure list                
   Name          Value       Type  Location
   ----          -----       ----  --------
  profile        <not set>       None  None
access_key   ****************7Z7Q shared-credentials-file
secret_key   ****************zIMT shared-credentials-file
  region        us-east-1   config-file  ~/.aws/config
handex-react\cdk on  master [$✘!+?⇡] is 📦 v0.1.0 via  v20.12.1 on ☁️ (us-east-1) 
```

---

**Codeium** _at 9:32 am, Jun 29, 2024_

The behavior you're observing where the `profile` appears as `<not set>` in the output of `aws configure list` is expected when the `AWS_PROFILE` environment variable is not set. The `aws configure list` command shows the current configuration and source for each setting. When it displays `profile <not set>`, it's indicating that no profile is explicitly set via the `AWS_PROFILE` environment variable for the current session.

Here's a clarification on how AWS CLI determines the profile to use:

1. **Environment Variable (`AWS_PROFILE`)**: If the `AWS_PROFILE` environment variable is set, AWS CLI uses this profile for operations. This environment variable directly influences the `profile` value you see in the output of `aws configure list`.

2. **Default Profile**: In the absence of the `AWS_PROFILE` environment variable, AWS CLI uses the `[default]` profile specified in your AWS configuration files (`~/.aws/credentials` and `~/.aws/config`). However, this default selection doesn't reflect as a `profile` value in the `aws configure list` command.

### To Set the Profile for the Current Session

To set the `mark` profile as the current profile for your session (and see it reflected in `aws configure list`), you can set the `AWS_PROFILE` environment variable in PowerShell:

```powershell
$env:AWS_PROFILE = "mark"
```

After setting this, run `aws configure list` again. You should see that the profile is now set to `mark`.

### Verification

```powershell
aws configure list
```

You should now see something like this, indicating that the `mark` profile is being used:

```
   Name                    Value             Type    Location
   ----                    -----             ----    --------
profile                mark             env      AWS_PROFILE
access_key     ****************7Z7Q shared-credentials-file
secret_key     ****************zIMT shared-credentials-file
region              us-east-1         config-file    ~/.aws/config
```

Remember, setting `$env:AWS_PROFILE` in PowerShell changes the profile only for the current session. If you open a new PowerShell window, you'll need to set the environment variable again unless you've made the change persistent as previously discussed.