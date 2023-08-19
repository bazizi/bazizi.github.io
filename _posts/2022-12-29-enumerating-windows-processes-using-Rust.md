---
layout: post
title:  "Enumerating Windows processes using Rust and the windows crate"
date:   2022-12-29
tags:
- Windows
- Rust
---

Windows API documentation has an example for [Enumerating All Processes](https://learn.microsoft.com/en-us/windows/win32/psapi/enumerating-all-processes) using C++. As an exercise, I decided to implement the same functionality using Rust and the  [windows](https://docs.rs/crate/windows-sys/latest) crate.


- Dependency on the [windows](https://docs.rs/crate/windows-sys/latest) crate and features are needed. I also used the `anyhow` crate for cleaner error handling, and the `log` and `env_logger` crates for logging:

```ini
# Cargo.toml
[package]
name = "process-info"
version = "0.1.0"
edition = "2021"

# See more keys and their definitions at https://doc.rust-lang.org/cargo/reference/manifest.html

[dependencies]
anyhow = "1.0.75"
env_logger = "0.10.0"
log = "0.4.20"
windows-sys = {version = "0.48.0", features = [
    "Win32_System_ProcessStatus", "Win32_Foundation",    # K32EnumProcessModules, K32EnumProcesses
    "Win32_System_Threading", # OpenProcess
    "Win32_System_LibraryLoader", # GetModuleFileNameA
]}
```

- The complete Rust code:

```rust
// main.rs

use anyhow::Result;
use std::error::Error;
use std::fmt::Display;
use windows_sys::Win32::Foundation::CloseHandle;
use windows_sys::Win32::Foundation::{GetLastError, MAX_PATH};
use windows_sys::Win32::Foundation::{HANDLE, HMODULE};
use windows_sys::Win32::System::ProcessStatus::EnumProcessModules;
use windows_sys::Win32::System::ProcessStatus::EnumProcesses;
use windows_sys::Win32::System::ProcessStatus::GetModuleBaseNameA;
use windows_sys::Win32::System::ProcessStatus::GetModuleFileNameExA;
use windows_sys::Win32::System::Threading::OpenProcess;
use windows_sys::Win32::System::Threading::{PROCESS_QUERY_INFORMATION, PROCESS_VM_READ};

const DEFAULT_BUFF_SIZE: usize = 1024;

fn main() {
    env_logger::init();

    match get_process_list() {
        Ok(process_list) => process_list.iter().for_each(|item| {
            log::info!("{:?}", item);
        }),
        Err(err) => {
            log::error!("{}", err);
        }
    }
}

#[derive(Debug)]
struct ProcessModule {
    name: String,
    path: String,
    id: u32,
}

#[derive(Debug)]
struct CustomError {
    message: String,
    code: Option<u32>,
}

impl Display for CustomError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{:?}", self)
    }
}

impl Error for CustomError {}

struct AutoProcessHandle {
    handle: HANDLE,
}

// RAI-style deallocator for the process handle
impl Drop for AutoProcessHandle {
    fn drop(&mut self) {
        if self.handle == 0 {
            return;
        }

        match unsafe { CloseHandle(self.handle) } {
            0 => {
                log::error!("Failed to drop process handle {}", self.handle);
            }
            _ => {}
        };
    }
}

fn get_process_ids() -> Result<Vec<u32>> {
    let mut process_ids = Vec::with_capacity(DEFAULT_BUFF_SIZE);
    process_ids.resize(DEFAULT_BUFF_SIZE, 0);
    let mut cb_needed: u32 = 0;

    match unsafe {
        EnumProcesses(
            process_ids.as_mut_ptr(),
            process_ids.len().try_into()?,
            &mut cb_needed,
        )
    } {
        0 => {
            return Err(CustomError {
                message: "EnumProcesses failed".to_owned(),
                code: Some(unsafe { GetLastError() }),
            }
            .into())
        }
        _ => {
            log::debug!("{} bytes is needed to store all process info", cb_needed)
        }
    }

    if cb_needed != process_ids.len().try_into()? {
        return Ok(process_ids);
    }

    // The buffer isn't large enough so we need to reallocate
    process_ids.resize(cb_needed as usize / std::mem::size_of::<u32>(), 0);

    match unsafe {
        EnumProcesses(
            process_ids.as_mut_ptr(),
            (process_ids.len() * std::mem::size_of::<u32>()).try_into()?,
            &mut cb_needed,
        )
    } {
        0 => {
            return Err(CustomError {
                message: "EnumProcesses failed".to_owned(),
                code: Some(unsafe { GetLastError() }),
            }
            .into())
        }
        _ => {}
    }

    assert_ne!(cb_needed, process_ids.len().try_into()?);

    Ok(process_ids)
}

fn get_module_handle(process_handle: HANDLE) -> Result<HMODULE> {
    let mut module_handle = 0;

    let mut cb_needed = 0;
    match unsafe { EnumProcessModules(process_handle, &mut module_handle, 0, &mut cb_needed) } {
        0 => {
            return Err(CustomError {
                message: "EnumProcessModules failed".to_owned(),
                code: Some(unsafe { GetLastError() }),
            }
            .into())
        }
        _ => {}
    };

    Ok(module_handle)
}

fn get_process_module_info(
    process_handle: HANDLE,
    process_id: u32,
    module_handle: HMODULE,
) -> Result<Option<ProcessModule>> {
    let mut module_path = Vec::<u8>::with_capacity(MAX_PATH.try_into()?);
    module_path.resize(MAX_PATH.try_into()?, 0);

    match unsafe {
        GetModuleFileNameExA(
            process_handle,
            module_handle,
            module_path.as_mut_ptr(),
            module_path.len().try_into()?,
        )
    } {
        0 => {
            return Ok(None);
        }
        _ => {}
    };

    let mut module_name = Vec::<u8>::with_capacity(MAX_PATH.try_into()?);
    module_name.resize(MAX_PATH.try_into()?, 0);

    match unsafe {
        GetModuleBaseNameA(
            process_handle,
            module_handle,
            module_name.as_mut_ptr(),
            module_name.len().try_into()?,
        )
    } {
        0 => {
            return Ok(None);
        }
        _ => {}
    };

    Ok(Some(ProcessModule {
        name: String::from_iter(
            module_name
                .iter()
                .take_while(|&&x| x != 0)
                .map(|&x| x as char),
        ),
        path: String::from_iter(
            module_path
                .iter()
                .take_while(|&&x| x != 0)
                .map(|&x| x as char),
        ),
        id: process_id,
    }))
}

fn get_process_list() -> Result<Vec<ProcessModule>> {
    let mut process_module_infos = Vec::new();

    let process_ids = get_process_ids()?;

    for i in 0..process_ids.len() {
        let process_handle = unsafe {
            OpenProcess(
                PROCESS_QUERY_INFORMATION | PROCESS_VM_READ,
                0,
                process_ids[i],
            )
        };

        if process_handle == 0 {
            continue;
        }

        // RAII-style process handle
        let process_handle = AutoProcessHandle {
            handle: process_handle,
        };

        let module_handle = get_module_handle(process_handle.handle)?;
        if let Some(process_module_info) =
            get_process_module_info(process_handle.handle, process_ids[i], module_handle)?
        {
            process_module_infos.push(process_module_info);
        }
    }

    Ok(process_module_infos)
}

```

The above Rust implementation is a bit more verbose compared to the [original C++ code](https://learn.microsoft.com/en-us/windows/win32/psapi/enumerating-all-processes) because it checks the required buffer size after calling `EnumProcesses` and resizes the buffer dynamically and retries (if needed).

The output of running `set RUST_LOG=process_info && cargo run` in `debug` build looks like the following:

```log
[2023-08-19T23:28:36Z DEBUG process_info] 784 bytes is needed to store all process info
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "sihost.exe", path: "C:\\Windows\\System32\\sihost.exe", id: 8320 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "nvcontainer.exe", path: "C:\\Program Files\\NVIDIA Corporation\\NvContainer\\nvcontainer.exe", id: 14352 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "svchost.exe", path: "C:\\Windows\\System32\\svchost.exe", id: 7164 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "svchost.exe", path: "C:\\Windows\\System32\\svchost.exe", id: 12564 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "nvcontainer.exe", path: "C:\\Program Files\\NVIDIA Corporation\\NvContainer\\nvcontainer.exe", id: 8256 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "svchost.exe", path: "C:\\Windows\\System32\\svchost.exe", id: 8252 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "taskhostw.exe", path: "C:\\Windows\\System32\\taskhostw.exe", id: 12860 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "Explorer.EXE", path: "C:\\Windows\\explorer.exe", id: 13020 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "svchost.exe", path: "C:\\Windows\\System32\\svchost.exe", id: 1072 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "StartMenuExperienceHost.exe", path: "C:\\Windows\\SystemApps\\Microsoft.Windows.StartMenuExperienceHost_cw5n1h2txyewy\\StartMenuExperienceHost.exe", id: 13644 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "RuntimeBroker.exe", path: "C:\\Windows\\System32\\RuntimeBroker.exe", id: 10940 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "NVIDIA Web Helper.exe", path: "C:\\Program Files (x86)\\NVIDIA Corporation\\NvNode\\NVIDIA Web Helper.exe", id: 7200 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "SearchApp.exe", path: "C:\\Windows\\SystemApps\\Microsoft.Windows.Search_cw5n1h2txyewy\\SearchApp.exe", id: 5152 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "conhost.exe", path: "C:\\Windows\\System32\\conhost.exe", id: 7236 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "RuntimeBroker.exe", path: "C:\\Windows\\System32\\RuntimeBroker.exe", id: 12268 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "RuntimeBroker.exe", path: "C:\\Windows\\System32\\RuntimeBroker.exe", id: 14984 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "ConEmu64.exe", path: "C:\\Users\\####\\cmder\\vendor\\conemu-maximus5\\ConEmu64.exe", id: 13600 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "PhoneExperienceHost.exe", path: "C:\\Program Files\\WindowsApps\\Microsoft.YourPhone_1.23062.153.0_x64__8wekyb3d8bbwe\\PhoneExperienceHost.exe", id: 7676 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "ConEmuC64.exe", path: "C:\\Users\\####\\cmder\\vendor\\conemu-maximus5\\ConEmu\\ConEmuC64.exe", id: 6728 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "conhost.exe", path: "C:\\Windows\\System32\\conhost.exe", id: 6900 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "TextInputHost.exe", path: "C:\\Windows\\SystemApps\\MicrosoftWindows.Client.CBS_cw5n1h2txyewy\\TextInputHost.exe", id: 10460 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "cmd.exe", path: "C:\\Windows\\System32\\cmd.exe", id: 15076 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "RuntimeBroker.exe", path: "C:\\Windows\\System32\\RuntimeBroker.exe", id: 10404 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "BingWallpaperApp.exe", path: "C:\\Users\\####\\AppData\\Local\\Microsoft\\BingWallpaperApp\\BingWallpaperApp.exe", id: 14472 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "svchost.exe", path: "C:\\Windows\\System32\\svchost.exe", id: 9572 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "ShellExperienceHost.exe", path: "C:\\Windows\\SystemApps\\ShellExperienceHost_cw5n1h2txyewy\\ShellExperienceHost.exe", id: 10736 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "RuntimeBroker.exe", path: "C:\\Windows\\System32\\RuntimeBroker.exe", id: 6544 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "SystemSettingsBroker.exe", path: "C:\\Windows\\System32\\SystemSettingsBroker.exe", id: 2012 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "NVIDIA Share.exe", path: "C:\\Program Files\\NVIDIA Corporation\\NVIDIA GeForce Experience\\NVIDIA Share.exe", id: 10340 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "NVIDIA Share.exe", path: "C:\\Program Files\\NVIDIA Corporation\\NVIDIA GeForce Experience\\NVIDIA Share.exe", id: 13272 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "NVIDIA Share.exe", path: "C:\\Program Files\\NVIDIA Corporation\\NVIDIA GeForce Experience\\NVIDIA Share.exe", id: 1468 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "Video.UI.exe", path: "C:\\Program Files\\WindowsApps\\Microsoft.ZuneVideo_10.22091.10041.0_x64__8wekyb3d8bbwe\\Video.UI.exe", id: 11848 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "RuntimeBroker.exe", path: "C:\\Windows\\System32\\RuntimeBroker.exe", id: 7920 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "svchost.exe", path: "C:\\Windows\\System32\\svchost.exe", id: 10660 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "SystemSettings.exe", path: "C:\\Windows\\ImmersiveControlPanel\\SystemSettings.exe", id: 14220 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "ApplicationFrameHost.exe", path: "C:\\Windows\\System32\\ApplicationFrameHost.exe", id: 3376 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "UserOOBEBroker.exe", path: "C:\\Windows\\System32\\oobe\\UserOOBEBroker.exe", id: 10900 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "Cortana.exe", path: "C:\\Program Files\\WindowsApps\\Microsoft.549981C3F5F10_4.2308.1005.0_x64__8wekyb3d8bbwe\\Cortana.exe", id: 13672 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "Code.exe", path: "C:\\Users\\####\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe", id: 3028 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "Code.exe", path: "C:\\Users\\####\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe", id: 7700 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "Code.exe", path: "C:\\Users\\####\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe", id: 5240 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "Code.exe", path: "C:\\Users\\####\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe", id: 7624 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "Code.exe", path: "C:\\Users\\####\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe", id: 7328 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "Code.exe", path: "C:\\Users\\####\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe", id: 10292 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "Code.exe", path: "C:\\Users\\####\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe", id: 11612 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "Code.exe", path: "C:\\Users\\####\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe", id: 5644 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "rust-analyzer.exe", path: "C:\\Users\\####\\.vscode\\extensions\\rust-lang.rust-analyzer-0.3.1623-win32-x64\\server\\rust-analyzer.exe", id: 5732 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "conhost.exe", path: "C:\\Windows\\System32\\conhost.exe", id: 9768 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "Code.exe", path: "C:\\Users\\####\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe", id: 5040 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "rust-analyzer-proc-macro-srv.exe", path: "C:\\Users\\####\\.rustup\\toolchains\\stable-x86_64-pc-windows-msvc\\libexec\\rust-analyzer-proc-macro-srv.exe", id: 8636 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "Code.exe", path: "C:\\Users\\####\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe", id: 13684 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "Code.exe", path: "C:\\Users\\####\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe", id: 10680 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "conhost.exe", path: "C:\\Windows\\System32\\conhost.exe", id: 11916 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "powershell.exe", path: "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe", id: 5792 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "ConEmuC64.exe", path: "C:\\Users\\####\\cmder\\vendor\\conemu-maximus5\\ConEmu\\ConEmuC64.exe", id: 10212 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "conhost.exe", path: "C:\\Windows\\System32\\conhost.exe", id: 8100 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "cmd.exe", path: "C:\\Windows\\System32\\cmd.exe", id: 12432 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "Code.exe", path: "C:\\Users\\####\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe", id: 13204 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "Code.exe", path: "C:\\Users\\####\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe", id: 15152 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "Code.exe", path: "C:\\Users\\####\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe", id: 7320 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "Code.exe", path: "C:\\Users\\####\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe", id: 7152 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "Code.exe", path: "C:\\Users\\####\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe", id: 11028 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "Code.exe", path: "C:\\Users\\####\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe", id: 14308 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "msedge.exe", path: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", id: 10964 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "msedge.exe", path: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", id: 1664 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "msedge.exe", path: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", id: 11608 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "msedge.exe", path: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", id: 9956 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "msedge.exe", path: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", id: 1932 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "msedge.exe", path: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", id: 12416 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "msedge.exe", path: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", id: 14504 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "msedge.exe", path: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", id: 1088 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "msedge.exe", path: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", id: 12236 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "msedge.exe", path: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", id: 8776 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "msedge.exe", path: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", id: 7068 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "msedge.exe", path: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", id: 9112 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "msedge.exe", path: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", id: 5868 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "msedge.exe", path: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", id: 7580 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "msedge.exe", path: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", id: 1132 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "msedge.exe", path: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", id: 12012 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "msedge.exe", path: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", id: 4892 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "msedge.exe", path: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", id: 8676 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "msedge.exe", path: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", id: 11484 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "msedge.exe", path: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", id: 14924 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "msedge.exe", path: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", id: 6316 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "msedge.exe", path: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", id: 5048 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "msedge.exe", path: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", id: 12456 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "msedge.exe", path: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", id: 9240 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "cargo.exe", path: "C:\\Users\\####\\.cargo\\bin\\cargo.exe", id: 6500 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "cargo.exe", path: "C:\\Users\\####\\.rustup\\toolchains\\stable-x86_64-pc-windows-msvc\\bin\\cargo.exe", id: 12984 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "cargo-watch.exe", path: "C:\\Users\\####\\.cargo\\bin\\cargo-watch.exe", id: 15060 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "cmd.exe", path: "C:\\Windows\\System32\\cmd.exe", id: 8480 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "cargo.exe", path: "C:\\Users\\####\\.rustup\\toolchains\\stable-x86_64-pc-windows-msvc\\bin\\cargo.exe", id: 10820 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "VCTIP.EXE", path: "C:\\Program Files (x86)\\Microsoft Visual Studio\\2022\\BuildTools\\VC\\Tools\\MSVC\\14.36.32532\\bin\\Hostx64\\x64\\vctip.exe", id: 3892 }
[2023-08-19T23:28:36Z INFO  process_info] ProcessModule { name: "process-info.exe", path: "C:\\Users\\####\\rust\\process-info\\target\\debug\\process-info.exe", id: 11860 }
```