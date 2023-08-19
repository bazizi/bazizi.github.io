---
layout: post
title:  "Enumerating Windows processes using Rust and the windows crate"
date:   2022-12-29
tags:
- Windows
- Rust
---

Windows API documentation has an example for [Enumerating All Modules For a Process](https://learn.microsoft.com/en-us/windows/win32/psapi/enumerating-all-modules-for-a-process) using C++. As an exercise, I decided to implement the same functionality using Rust and the  [windows](https://docs.rs/crate/windows-sys/latest) crate.


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

use std::error::Error;
use std::fmt::Display;

use anyhow::Result;
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
        _ => {
            log::debug!("EnumProcesses success");
        }
    }

    assert_ne!(cb_needed, process_ids.len().try_into()?);

    Ok(process_ids)
}

fn get_modules(process_handle: HANDLE) -> Result<Vec<HMODULE>> {
    let mut module_handles = Vec::with_capacity(DEFAULT_BUFF_SIZE);
    module_handles.resize(DEFAULT_BUFF_SIZE, 0);

    let mut cb_needed = 0;
    match unsafe {
        EnumProcessModules(
            process_handle,
            module_handles.as_mut_ptr(),
            0,
            &mut cb_needed,
        )
    } {
        0 => {
            return Err(CustomError {
                message: "EnumProcessModules failed".to_owned(),
                code: Some(unsafe { GetLastError() }),
            }
            .into())
        }
        _ => {
            log::debug!("EnumProcessModules success (getting the required size)");
        }
    };

    if cb_needed != module_handles.len().try_into()? {
        return Ok(module_handles);
    }

    // The buffer isn't large enough so we need to reallocate
    module_handles.resize(cb_needed as usize / std::mem::size_of::<u32>(), 0);

    match unsafe {
        EnumProcessModules(
            process_handle,
            module_handles.as_mut_ptr(),
            (module_handles.len() * std::mem::size_of::<u32>()).try_into()?,
            &mut cb_needed,
        )
    } {
        0 => {
            return Err(CustomError {
                message: "EnumProcessModules failed".to_owned(),
                code: Some(unsafe { GetLastError() }),
            }
            .into())
        }
        _ => {
            log::debug!("EnumProcessModules success");
        }
    };

    assert_ne!(cb_needed, module_handles.len().try_into()?);

    Ok(module_handles)
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
        _ => {
            log::debug!("GetModuleFileNameExA success");
        }
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
        _ => {
            log::debug!("GetModuleBaseNameA success");
        }
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

        for module_handle in get_modules(process_handle)? {
            if let Some(process_module_info) =
                get_process_module_info(process_handle, process_ids[i], module_handle)?
            {
                process_module_infos.push(process_module_info);
            }

            match unsafe {
                CloseHandle(process_handle);
            } {
                _ => {}
            };
        }
    }

    Ok(process_module_infos)
}

```

The above Rust implementation is a bit more verbose compared to the [original C++ code](https://learn.microsoft.com/en-us/windows/win32/psapi/enumerating-all-modules-for-a-process) because it checks the buffer size upon calling `EnumProcesses` and `EnumProcessModules` and resizes the buffers dynamically and retries (if needed).

The output of running `set RUST_LOG=process_info && cargo run` in `debug` build looks like the following:

```log
[2023-08-19T22:54:41Z DEBUG process_info] 688 bytes is needed to store all process info
[2023-08-19T22:54:41Z DEBUG process_info] EnumProcessModules success (getting the required size)
[2023-08-19T22:54:41Z DEBUG process_info] GetModuleFileNameExA success
...
[2023-08-19T22:54:41Z DEBUG process_info] EnumProcessModules success (getting the required size)
[2023-08-19T22:54:41Z INFO  process_info] ProcessModule { name: "sihost.exe", path: "C:\\Windows\\System32\\sihost.exe", id: 8320 }
[2023-08-19T22:54:41Z INFO  process_info] ProcessModule { name: "nvcontainer.exe", path: "C:\\Program Files\\NVIDIA Corporation\\NvContainer\\nvcontainer.exe", id: 14352 }
[2023-08-19T22:54:41Z INFO  process_info] ProcessModule { name: "svchost.exe", path: "C:\\Windows\\System32\\svchost.exe", id: 7164 }
[2023-08-19T22:54:41Z INFO  process_info] ProcessModule { name: "svchost.exe", path: "C:\\Windows\\System32\\svchost.exe", id: 12564 }
[2023-08-19T22:54:41Z INFO  process_info] ProcessModule { name: "nvcontainer.exe", path: "C:\\Program Files\\NVIDIA Corporation\\NvContainer\\nvcontainer.exe", id: 8256 }
...
[2023-08-19T22:54:41Z INFO  process_info] ProcessModule { name: "svchost.exe", path: "C:\\Windows\\System32\\svchost.exe", id: 8252 }
[2023-08-19T22:54:41Z INFO  process_info] ProcessModule { name: "taskhostw.exe", path: "C:\\Windows\\System32\\taskhostw.exe", id: 12860 }
[2023-08-19T22:54:41Z INFO  process_info] ProcessModule { name: "Explorer.EXE", path: "C:\\Windows\\explorer.exe", id: 13020 }
[2023-08-19T22:54:41Z INFO  process_info] ProcessModule { name: "svchost.exe", path: "C:\\Windows\\System32\\svchost.exe", id: 1072 }
[2023-08-19T22:54:41Z INFO  process_info] ProcessModule { name: "process-info.exe", path: "C:\\Users\\behna\\rust\\process-info\\target\\debug\\process-info.exe", id: 3240 }
```