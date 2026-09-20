---
title: "Embedded Rust #1: Running Bare-Metal Rust Firmware on STM32 with macOS"
date: 2026-09-19
lang: en
translation_id: embedded-rust-01
permalink: /en/embedded-rust-01/
categories:
    - Embedded
tags:
    - Rust
    - Embedded Rust
    - STM32
toc: true
toc_sticky: true
---

### Getting Started

I recently started learning Rust again and chose embedded development as a new environment to explore.

I had studied Rust some time ago by working through a book as part of a study group, and what I remember most is its somewhat challenging syntax.

For this project, I am using an STM32F3 Discovery board with an STM32F303VCT6 (ARM Cortex-M4F) MCU. I originally used this board in an Embedded Programming course at college, so I decided to put it back to use for this project.

The first goal was simple: build a program for the board, flash it to the MCU, and verify that it runs successfully.

This post summarizes that process.

---

### Development Environment

The environment used for this project is:

* macOS (Apple Silicon)
* STM32F303VCT6
* ARM Cortex-M4F
* Rust
* thumbv7em-none-eabihf
* probe-rs 0.32.0
* ST-LINK V2-1

First, I checked whether the Mac could detect the board through ST-LINK.
```bash
probe-rs list
```
Result:
```bash
The following debug probes were found:
[0]: STLink V2-1 -- 0483:374b:... (ST-LINK)
```
---

### Installing the Rust Target for Cortex-M4F

A typical Rust program is compiled for the operating system and CPU of the development machine.

Since the development environment is not configured for the board by default, I added the Rust target for ARM Cortex-M4F.

rustup target add thumbv7em-none-eabihf

The target name thumbv7em-none-eabihf can roughly be broken down as follows:

* thumbv7em: ARMv7E-M Thumb instruction set
* none: bare-metal environment without an operating system
* eabi: Embedded ABI
* hf: hardware floating-point ABI

---

### Starting the Project
```bash
cargo new embedded-rust
cd embedded-rust
```
I plan to keep developing this single project as I learn GPIO, interrupts, timers, UART, sensor communication, and other embedded concepts.

For the first stage, I added only the following dependencies:
```bash
cargo add cortex-m
cargo add cortex-m-rt
cargo add panic-halt
```
Each crate has a different role:

* cortex-m: access to Cortex-M processor functionality
* cortex-m-rt: Cortex-M runtime and startup support
* panic-halt: halts the processor when a panic occurs

---

### Writing the Basic Firmware
```rust
#![no_std]
#![no_main]

use cortex_m_rt::entry;
use panic_halt as _;

#[entry]
fn main() -> ! {
    loop {}
}
```

The two major differences from a typical Rust program are:
```rust
#![no_std]
#![no_main]
```
```rust
#![no_std]
```
A typical Rust application can use the std standard library.

However, the STM32 does not have an operating system such as macOS or Linux.

Instead of using Rust’s standard library, which depends on operating-system functionality, the firmware is built on core, which is available in a bare-metal environment.
```rust
#![no_main]
```
The usual application startup mechanism is not available either.

Instead, I use the #[entry] attribute provided by cortex-m-rt.
```rust
#[entry]
fn main() -> ! {
    loop {}
}
```
The ! return type means that the function never returns.

Since there is no operating system for the firmware to return to after main() finishes, embedded firmware typically continues running indefinitely.

---

### STM32 Memory Layout

In a bare-metal environment, the linker also needs to know where the program should be placed in memory.

The STM32F303VCT6 has the following memory regions:

| Memory | Start Address | Size | Purpose |
| --- | --- | --- | --- |
| FLASH | `0x0800_0000` | 256 KB | Firmware / Code |
| SRAM | `0x2000_0000` | 40 KB | General-purpose RAM |
| CCMRAM | `0x1000_0000` | 8 KB | Core-Coupled Memory |

I added a memory.x file to describe this memory layout to the linker.
```bash
MEMORY
{
  FLASH  : ORIGIN = 0x08000000, LENGTH = 256K
  RAM    : ORIGIN = 0x20000000, LENGTH = 40K
  CCMRAM : ORIGIN = 0x10000000, LENGTH = 8K
}
```
The firmware itself is stored in Flash, while SRAM is used for runtime data such as the stack and variables.

---

### Configuring Cargo for the STM32 Target

I configured .cargo/config.toml so that the project builds for the STM32 target.
```bash
[build]
target = "thumbv7em-none-eabihf"
[target.thumbv7em-none-eabihf]
runner = "probe-rs run --chip STM32F303VC"
rustflags = [
    "-C", "link-arg=-Tlink.x",
]
```
Now cargo build generates a Cortex-M binary instead of a macOS binary.

---

I built the firmware with:
```bash
cargo build
```
Then I checked whether the generated executable was actually built for ARM.
```bash
file target/thumbv7em-none-eabihf/debug/embedded-rust
```
Result:
```bash
ELF 32-bit LSB executable, ARM, EABI5 version 1 (SYSV),
statically linked, with debug_info, not stripped
```
---

Flashing the Firmware through ST-LINK

With the ELF executable ready, I flashed it to the STM32.
```bash
cargo run
```
Since probe-rs is configured as the runner in .cargo/config.toml, Cargo uses it to program the MCU.
```bash
Running `probe-rs run --chip STM32F303VC ...`
Erasing     ✔ 100%
Programming ✔ 100%
Finished in 0.35s
```
This confirmed that the firmware was successfully written to the STM32 Flash memory.

---

### What I Learned

In this first step, I focused on understanding and verifying the basic process of running Rust firmware on an embedded target.

Concepts such as no_std, program entry points, memory layout, and flashing firmware were quite different from the backend development environment I am used to.

From here, I plan to continue adding features step by step and expand my understanding of embedded development.