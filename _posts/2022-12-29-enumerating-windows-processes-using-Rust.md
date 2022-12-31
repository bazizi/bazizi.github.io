---
layout: post
title:  "Enumerating Windows processes using Rust and the windows crate"
date:   2022-12-29
tags:
- Windows
- Rust
---

Windows API documentation has an example for [Enumerating All Modules For a Process](https://learn.microsoft.com/en-us/windows/win32/psapi/enumerating-all-modules-for-a-process) using C++. As an exercise, I decided to implement the same functionality using Rust and the  [windows](https://docs.rs/crate/windows-sys/latest) crate.


- Dependency on the [windows](https://docs.rs/crate/windows-sys/latest) crate and features needed:

```ini
# Cargo.toml

[package]
name = "process-info"
version = "0.1.0"
edition = "2021"

# See more keys and their definitions at https://doc.rust-lang.org/cargo/reference/manifest.html

[target.'cfg(windows)'.dependencies]
windows-sys = {version = "0.42.0", features = [
    "Win32_System_ProcessStatus", "Win32_Foundation",    # K32EnumProcessModules, K32EnumProcesses
    "Win32_System_Threading", # OpenProcess
    "Win32_System_LibraryLoader", # GetModuleFileNameA
]}

```

- The complete Rust code:

```rust
// main.rs

fn main() {
    // yes unwrap is bad, but this is not production code either!
    println!("{:?}", get_process_list().unwrap());
}

#[derive(Debug)]
struct Process {
    name: String,
    path: String,
    id: u32,
}

fn get_process_list() -> Result<Vec<Process>, Error> {
    let mut process_info = Vec::new();

    let mut process_ids = Vec::with_capacity(1024);
    process_ids.resize(1024, 0);
    let mut cb_needed: u32 = 0;

    if unsafe {
        use windows_sys::Win32::System::ProcessStatus::K32EnumProcesses;
        K32EnumProcesses(
            process_ids.as_mut_ptr(),
            (process_ids.len() * std::mem::size_of::<u32>()) as u32,
            &mut cb_needed,
        )
    } == 0
    {
        return Err(Error::last_os_error());
    } else {
        println!("\nInitial EnumProcesses success");
    }

    let num_processes = cb_needed as usize / std::mem::size_of::<u32>();
    process_ids.resize(num_processes, 0);

    use windows_sys::Win32::System::Threading::OpenProcess;
    use windows_sys::Win32::System::Threading::{PROCESS_QUERY_INFORMATION, PROCESS_VM_READ};

    for i in 0..num_processes {
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

        use windows_sys::Win32::Foundation::MAX_PATH;

        let mut process_name = Vec::<u8>::new();
        process_name.resize(MAX_PATH as usize, 0);

        let mut process_path = Vec::<u8>::new();
        process_path.resize(MAX_PATH as usize, 0);

        use windows_sys::Win32::Foundation::HINSTANCE;
        let mut module_handle: HINSTANCE = 0;
        cb_needed = 0;

        unsafe {
            use windows_sys::Win32::System::ProcessStatus::K32EnumProcessModules;

            if K32EnumProcessModules(
                process_handle,
                &mut module_handle,
                std::mem::size_of::<u32>() as u32,
                &mut cb_needed,
            ) != 0
            {
                use windows_sys::Win32::System::ProcessStatus::K32GetModuleFileNameExA;

                K32GetModuleFileNameExA(
                    process_handle,
                    module_handle,
                    process_path.as_mut_ptr(),
                    process_path.len() as u32,
                );

                use windows_sys::Win32::System::ProcessStatus::K32GetModuleBaseNameA;
                K32GetModuleBaseNameA(
                    process_handle,
                    module_handle,
                    process_name.as_mut_ptr(),
                    process_name.len() as u32,
                );

                let process = Process {
                    name: String::from_iter(
                        process_name
                            .iter()
                            .take_while(|&&x| x != 0)
                            .map(|&x| x as char),
                    ),
                    path: String::from_iter(
                        process_path
                            .iter()
                            .take_while(|&&x| x != 0)
                            .map(|&x| x as char),
                    ),
                    id: process_ids[i],
                };

                process_info.push(process);
            }

            use windows_sys::Win32::Foundation::CloseHandle;
            CloseHandle(process_handle);
        }
    }

    Ok(process_info)
}

```


I put the complete source code of the project (which also uses `egui` to show process info) on [Github](https://github.com/bazizi/rusty-task-manager).
