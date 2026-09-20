---
title: "Embedded Rust #1: macOS에서 STM32 Bare-Metal Rust Firmware 실행하기"
date: 2026-09-19
lang: ko
translation_id: embedded-rust-01
permalink: /ko/embedded-rust-01/
categories:
    - Embedded
tags:
    - Rust
    - Embedded Rust
    - STM32
toc: true
toc_sticky: true
---

### 시작하며

최근 Rust 학습을 다시 시작하며 새로운 개발환경으로 Embedded를 선택했습니다. Rust는 오래전에 스터디를 목적으로 책 한권을 읽어 본적이 있었는데 어려운(?) 문법이 기억에 남습니다.

학습에 사용하는 보드는 STM32F3 Discovery이며 MCU는 STM32F303VCT6 (ARM Cortex-M4F) 입니다. 컬리지 Embedded Programming 과정에서 사용했던 보드를 재활용 합니다.

첫 번째 목표는 보드에 프로그램을 빌드하고, Flash 메모리에 기록하고 실제 실행되는 과정을 확인했습니다.

이번 글에서는 이 과정을 정리합니다.

---

### 개발 환경

이번 학습에서 사용한 환경은 다음과 같습니다.

* macOS (Apple Silicon)
* STM32F303VCT6
* ARM Cortex-M4F
* Rust
* thumbv7em-none-eabihf
* probe-rs 0.32.0
* ST-LINK V2-1

먼저 mac과 보드가 연결되는지 ST-LINK를 확인합니다.
```bash
probe-rs list
```
결과:
```bash
The following debug probes were found:
[0]: STLink V2-1 -- 0483:374b:... (ST-LINK)
```
---

### Cortex-M4F용 Rust Target 설치

일반적인 Rust 프로그램은 현재 운영체제와 CPU를 대상으로 컴파일됩니다.

통상 보드를 위한 환경이 설정되어 있지 않테니 ARM Cortex-M4F를 위한 환경을 추가합니다.
```bash
rustup target add thumbv7em-none-eabihf
```

thumbv7em-none-eabihf를 나누어 보면 대략 다음과 같은 의미를 가집니다.

* thumbv7em: ARMv7E-M Thumb instruction set
* none: 운영체제가 없는 bare-metal 환경
* eabi: Embedded ABI
* hf: hardware floating-point ABI


---

### 프로젝트 시작하기
```bash
cargo new embedded-rust
cd embedded-rust
```
이 프로젝트는 앞으로 GPIO, interrupt, timer, UART, sensor communication 등의 기능을 계속 추가하면서 하나의 embedded project로 발전시킬 계획입니다.

첫 단계에서는 다음 dependency만 추가했습니다.
```bash
cargo add cortex-m
cargo add cortex-m-rt
cargo add panic-halt
```
각 crate의 역할은 다음과 같습니다.

* cortex-m: Cortex-M CPU 기능 접근
* cortex-m-rt: Cortex-M runtime과 startup 지원
* panic-halt: panic 발생 시 processor를 halt

---

### 기본 프로그램 작성
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

일반적인 Rust 프로그램과 가장 큰 차이는 다음 두 줄입니다.

```rust
#![no_std]
#![no_main]
```
```rust
#![no_std]
```
일반적인 Rust 프로그램에서는 standard library인 std를 사용할 수 있습니다.

하지만 STM32에는 macOS나 Linux 같은 운영체제가 없습니다.

따라서 OS 기능에 의존하는 Rust standard library 대신 bare-metal 환경에서 사용할 수 있는 core를 기반으로 프로그램을 작성합니다.
```rust
#![no_main]
```
일반적인 프로그램의 시작 방식도 사용할 수 없습니다.

대신 cortex-m-rt가 제공하는 #[entry]를 사용합니다.
```rust
#[entry]
fn main() -> ! {
    loop {}
}
```
반환 타입인 !는 이 함수가 return하지 않는다는 의미입니다.

Firmware의 main()이 종료되더라도 돌아갈 운영체제가 없기 때문에 embedded firmware는 일반적으로 계속 실행됩니다.

---

### STM32의 메모리 구조

Bare-metal 환경에서는 프로그램을 메모리 어디에 배치할지도 알아야 합니다.

STM32F303VCT6의 주요 메모리 영역은 다음과 같습니다.

| 메모리 | 시작 주소 | 크기 | 용도 |
| --- | --- | --- | --- |
| FLASH | `0x0800_0000` | 256 KB | 펌웨어 / 코드 |
| SRAM | `0x2000_0000` | 40 KB | 일반 RAM |
| CCMRAM | `0x1000_0000` | 8 KB | Core-Coupled Memory |

이를 linker에게 알려주기 위해 프로젝트에 memory.x를 추가했습니다.

```bash
MEMORY
{
  FLASH : ORIGIN = 0x08000000, LENGTH = 256K
  RAM   : ORIGIN = 0x20000000, LENGTH = 40K
  CCMRAM : ORIGIN = 0x10000000, LENGTH = 8K
}
```
Firmware 자체는 Flash에 저장되고, 실행 중 필요한 stack과 data 등은 SRAM을 사용합니다.

---

### Cargo를 STM32 target으로 설정하기

.cargo/config.toml에서 기본 build target을 STM32F303에 맞게 수정했습니다.
```bash 
[build]
target = "thumbv7em-none-eabihf"
[target.thumbv7em-none-eabihf]
runner = "probe-rs run --chip STM32F303VC"
rustflags = [
    "-C", "link-arg=-Tlink.x",
]
```
이제 cargo build는 macOS binary가 아니라 Cortex-M용 binary를 생성합니다.

---

이제 첫 번째 빌드를 시작합니다.
```bash
cargo build
```
생성된 파일이 실제 ARM executable인지 확인합니다.
```bash
file target/thumbv7em-none-eabihf/debug/embedded-rust
```
결과:
```bash
ELF 32-bit LSB executable, ARM, EABI5 version 1 (SYSV),
statically linked, with debug_info, not stripped
```
---

### ST-LINK를 통해 Firmware Flash하기

이제 생성된 ELF를 실제 STM32에 올립니다.
```bash
cargo run
```
.cargo/config.toml에 runner를 설정했기 때문에 내부적으로 probe-rs가 실행됩니다.
```bash
Running `probe-rs run --chip STM32F303VC ...`
Erasing     ✔ 100%
Programming ✔ 100%
Finished in 0.35s
```
이것으로 firmware가 실제 STM32 Flash에 기록된 것을 확인했습니다.

---

이번 과정에서는 embedded programming을 이해하기 위해 기본 실행을 확인했습니다.

embedded programming의 no_std, 프로그래밍의 entry point, 보드에 기록하는 flashing 등 기존의 백엔드 개발과는 많이 다른 절차와 용어들이었습니다.

이제부터 하나씩 추가로 학습하며 영역을 확장해보겠습니다.