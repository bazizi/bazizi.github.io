---
layout: post
title:  "Enumerating Windows processes using Rust and the winapi crate"
date:   2022-12-29
tags:
- WinAPI
- Rust
---

Windows API documentation has an example for [Enumerating All Modules For a Process](https://learn.microsoft.com/en-us/windows/win32/psapi/enumerating-all-modules-for-a-process) using C++. As an exercise, I decided to implement the same functionality using Rust and the  (unofficial) [winapi](https://docs.rs/winapi/latest/winapi/) crate.


- Dependency on the [winapi](https://docs.rs/winapi/latest/winapi/) crate and features needed:

```ini
# Cargo.toml

[package]
name = "process-info"
version = "0.1.0"
edition = "2021"

# See more keys and their definitions at https://doc.rust-lang.org/cargo/reference/manifest.html

[target.'cfg(windows)'.dependencies]
winapi = { version = "0.3", features = ["psapi", "processthreadsapi", "winnt", "handleapi"] }
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
    use std::ptr::null_mut;
    use winapi::shared::minwindef::{DWORD, HMODULE, MAX_PATH};
    use winapi::um::handleapi::CloseHandle;
    use winapi::um::processthreadsapi::OpenProcess;
    use winapi::um::psapi::{
        EnumProcessModules, EnumProcesses, GetModuleBaseNameA, GetModuleFileNameExA,
    };
    use winapi::um::winnt::{PROCESS_QUERY_INFORMATION, PROCESS_VM_READ};

    let mut process_ids = Vec::with_capacity(1024);
    process_ids.resize(1024, 0);

    let mut cb_needed: DWORD = 0;
    if unsafe {
        // get the size needed for the process_ids buffer
        EnumProcesses(
            process_ids.as_mut_ptr(),
            (process_ids.len() * std::mem::size_of::<DWORD>()) as DWORD,
            &mut cb_needed,
        )
    } == 0
    {
        return Err(Error::last_os_error());
    } else {
        println!("\nInitial EnumProcesses success");
    }


    let num_processes = cb_needed as usize / std::mem::size_of::<DWORD>();
    process_ids.resize(num_processes, 0);

    let mut process_info = Vec::new();
    for i in 0..num_processes {
        let process_handle = unsafe {
            OpenProcess(
                PROCESS_QUERY_INFORMATION | PROCESS_VM_READ,
                0,
                process_ids[i],
            )
        };

        if process_handle.is_null() {
            continue;
        }

        let mut process_name = Vec::<i8>::new();
        process_name.resize(MAX_PATH, 0);

        let mut process_path = Vec::<i8>::new();
        process_path.resize(MAX_PATH, 0);

        let mut module_handle: HMODULE = null_mut();
        cb_needed = 0;

        unsafe {
            if EnumProcessModules(
                process_handle,
                &mut module_handle,
                std::mem::size_of::<HMODULE>() as DWORD,
                &mut cb_needed,
            ) != 0
            {
                GetModuleFileNameExA(
                    process_handle,
                    module_handle,
                    process_path.as_mut_ptr(),
                    process_path.len() as DWORD,
                );

                GetModuleBaseNameA(
                    process_handle,
                    module_handle,
                    process_name.as_mut_ptr(),
                    process_name.len() as DWORD,
                );

                let process = Process {
                    name: String::from_iter(
                        process_name
                            .iter()
                            .take_while(|&&x| x != 0)
                            .map(|&x| x as u8 as char),
                    ),
                    path: String::from_iter(
                        process_path
                            .iter()
                            .take_while(|&&x| x != 0)
                            .map(|&x| x as u8 as char),
                    ),
                    id: process_ids[i],
                };

                process_info.push(process);
            }

            CloseHandle(process_handle);
        }
    }

    Ok(process_info)
}
```


I put the complete source code of the project (which also uses `egui` to show process info) on [Github](https://github.com/bazizi/rusty-task-manager).
