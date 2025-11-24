+++
title = "Alpine in QEMU: A Practical Guide From Scratch"
date = 2025-07-07T20:56:38-03:00
[taxonomies]
tags = ['Alpine Linux', 'Virtualization', 'QEMU', 'Docker']
series = ['Linux Playground From Scratch']
[extra]
add_toc = true
series = true
+++

In this post, we'll go through the steps needed to install [Alpine Linux](https://alpinelinux.org/) as a guest OS in a virtual machine. Alpine is a lightweight Linux distribution based on [musl libc](https://musl.libc.org/) and [busybox](https://busybox.net/). Because of its minimal size, it is commonly used as a base for [container images](https://opencontainers.org/). Here, taking advantage of its size, we'll use it to install [Docker](https://en.wikipedia.org/wiki/Docker_%28software%29), aiming for a smaller image than what we'd get using Debian (as shown in the [previous post](@/blog/2024/12/2024-12-23_-_vm-guest-os-debian.en.md)). The main purpose of this image is to let us run containers from [Termux](https://en.wikipedia.org/wiki/Termux), which isn't possible on a regular (non-[rooted](https://en.wikipedia.org/wiki/Rooting_%28Android%29)) Android device.


Bootstrap Alpine Linux OS
-------------------------

We'll start by creating a directory for our workspace and moving into it.

```bash
mkdir alpine && cd alpine
```


### Download Files

Below are the environment variables used to [download](https://alpinelinux.org/downloads/) the files needed to set up the VM image.

```bash
ALPINE_RELEASE="3.21.3"
ALPINE_VERSION="v${ALPINE_RELEASE%.*}"
ALPINE_TYPE="virt"
ALPINE_ARCH="x86_64"
ALPINE_CD_FILE="alpine-${ALPINE_TYPE}-${ALPINE_RELEASE}-${ALPINE_ARCH}.iso"
```

Using those values, download the files with [cURL](https://en.wikipedia.org/wiki/CURL). We're selecting the [installation medium](https://docs.alpinelinux.org/user-handbook/0.1a/Installing/medium.html) for the **64-bit Intel/AMD** architecture and the **virtual** image type.

```bash
curl -LO "https://alpinelinux.org/keys/ncopa.asc" && \
curl -LO "https://dl-cdn.alpinelinux.org/alpine/${ALPINE_VERSION}/releases/${ALPINE_ARCH}/alpine-${ALPINE_TYPE}-${ALPINE_RELEASE}-${ALPINE_ARCH}.iso" && \
curl -LO "https://dl-cdn.alpinelinux.org/alpine/${ALPINE_VERSION}/releases/${ALPINE_ARCH}/alpine-${ALPINE_TYPE}-${ALPINE_RELEASE}-${ALPINE_ARCH}.iso.sha256" && \
curl -LO "https://dl-cdn.alpinelinux.org/alpine/${ALPINE_VERSION}/releases/${ALPINE_ARCH}/alpine-${ALPINE_TYPE}-${ALPINE_RELEASE}-${ALPINE_ARCH}.iso.asc"
```


### Files Integrity and Authenticity {#files-integrity-and-authenticity}

One of the downloaded files contains a [SHA-2](https://en.wikipedia.org/wiki/SHA-2) cryptographic hash that we can use to verify the integrity and authenticity of the [`iso`](https://en.wikipedia.org/wiki/Optical_disc_image) file.

```bash
sha256sum --check "alpine-${ALPINE_TYPE}-${ALPINE_RELEASE}-${ALPINE_ARCH}.iso.sha256"
```

Another way to verify the file is using [GPG](https://en.wikipedia.org/wiki/GNU_Privacy_Guard). First, check that the GPG key file has the correct fingerprint. You can find it on the download page. At the time of writing, the fingerprint is `0482 D840 22F5 2DF1 C4E7 CD43 293A CD09 07D9 495A`.

```bash
gpg --with-fingerprint --dry-run ncopa.asc | grep --only-matching --extended-regexp '[0-9A-F][0-9A-F ]{49,50}'
```

Then import the GPG key.

```bash
gpg --import ncopa.asc
```

Next you can verify the ISO file.

```bash
gpg --verify "alpine-${ALPINE_TYPE}-${ALPINE_RELEASE}-${ALPINE_ARCH}.iso.asc" "alpine-${ALPINE_TYPE}-${ALPINE_RELEASE}-${ALPINE_ARCH}.iso"
```

You should see output similar to the following.

```text
gpg: Signature made jue 13 feb 2025 20:58:06 -03 using RSA key ID 07D9495A
gpg: Good signature from "Natanael Copa <ncopa@alpinelinux.org>"
gpg: WARNING: This key is not certified with a trusted signature!
gpg:          There is no indication that the signature belongs to the owner.
Primary key fingerprint: 0482 D840 22F5 2DF1 C4E7  CD43 293A CD09 07D9 495A
```

The warning indicates the signature isn't trusted. Let's fix that.

```bash
gpg --edit-key 'ncopa@alpinelinux.org'
```

Then select `trust`, choose option `5` ('I trust ultimately') and then `quit`.

```text
gpg (GnuPG) 1.4.20; Copyright (C) 2015 Free Software Foundation, Inc.
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.


pub  4096R/07D9495A  created: 2014-12-10  expires: never       usage: SC
                     trust: unknown       validity: unknown
sub  4096R/63FE7A06  created: 2014-12-10  expires: never       usage: E
[ unknown] (1). Natanael Copa <ncopa@alpinelinux.org>

gpg> trust
pub  4096R/07D9495A  created: 2014-12-10  expires: never       usage: SC
                     trust: unknown       validity: unknown
sub  4096R/63FE7A06  created: 2014-12-10  expires: never       usage: E
[ unknown] (1). Natanael Copa <ncopa@alpinelinux.org>

Please decide how far you trust this user to correctly verify other users' keys
(by looking at passports, checking fingerprints from different sources, etc.)

  1 = I don't know or won't say
  2 = I do NOT trust
  3 = I trust marginally
  4 = I trust fully
  5 = I trust ultimately
  m = back to the main menu

Your decision? 5
Do you really want to set this key to ultimate trust? (y/N) y

pub  4096R/07D9495A  created: 2014-12-10  expires: never       usage: SC
                     trust: ultimate      validity: unknown
sub  4096R/63FE7A06  created: 2014-12-10  expires: never       usage: E
[ unknown] (1). Natanael Copa <ncopa@alpinelinux.org>
Please note that the shown key validity is not necessarily correct
unless you restart the program.

gpg> quit
```

Verifying the file again should now show something like below.

```text
gpg: Signature made jue 13 feb 2025 20:58:06 -03 using RSA key ID 07D9495A
gpg: checking the trustdb
gpg: 3 marginal(s) needed, 1 complete(s) needed, PGP trust model
gpg: depth: 0  valid:   1  signed:   0  trust: 0-, 0q, 0n, 0m, 0f, 1u
gpg: Good signature from "Natanael Copa <ncopa@alpinelinux.org>"
```


### Create Disk Image

From this point, the following commands will use the [QEMU](https://www.qemu.org/) machine emulator and virtualizer, version **2.5.0**.

```bash
qemu-system-x86_64 --version
# > QEMU emulator version 2.5.0 (Debian 1:2.5+dfsg-5ubuntu10.51+esm3), Copyright (c) 2003-2008 Fabrice Bellard
```

Set the environment variables that we'll use in the next steps.

```bash
GUEST_IMAGE_SIZE="5G"
GUEST_IMAGE_FILE="alpine-${ALPINE_RELEASE}-${ALPINE_ARCH}.qcow2"
```

Create the [Qemu Qcow2](https://en.wikipedia.org/wiki/Qcow) disk image. One of the main characteristics of this type of image is that it will grow as data is added, optimizing storage space and enhancing flexibility. This feature allows users to start with a small image, expanding it as needed without wasting resources.

```bash
qemu-img create -f qcow2 "${GUEST_IMAGE_FILE}" "${GUEST_IMAGE_SIZE}"
```


### Install Alpine Linux {#install-alpine-linux}

Start the virtual machine using the Alpine Linux ISO and the created disk image.

```bash
qemu-system-x86_64  \
  -machine accel=kvm,type=q35 \
  -cpu host \
  -m 1G \
  -device virtio-net-pci,netdev=net0 \
  -netdev user,id=net0,hostfwd=tcp::2222-:22 \
  -cdrom "${ALPINE_CD_FILE}" \
  -drive if=virtio,format=qcow2,file="${GUEST_IMAGE_FILE}" \
  -nographic
```

Wait until the VM boot and log in as the **`root`** user when prompted.

```text
ISOLINUX 6.04 6.04-pre1  Copyright (C) 1994-2015 H. Peter Anvin et al
boot:

Welcome to Alpine Linux 3.21
Kernel 6.12.13-0-virt on an x86_64 (/dev/ttyS0)

localhost login: root
Welcome to Alpine!

The Alpine Wiki contains a large amount of how-to guides and general
information about administrating Alpine systems.
See <https://wiki.alpinelinux.org/>.

You can setup the system with the command: setup-alpine

You may change this message by editing /etc/motd.

localhost:~#
```

To automate the setup process, let's create an [answer file](https://docs.alpinelinux.org/user-handbook/0.1a/Installing/setup_alpine.html#_answer_files) that contains custom values for the installation script's questions, saving time and ensuring consistency. If you find that any option doesn't align with your needs, you can comment it out or modify it.

```bash
cat <<HEREDOC > answerfile
# Answer file for 'setup-alpine' script
# Generated with: 'setup-alpine -c answerfile'
# If you don't want to use a certain option, then comment it out.

# Use ES layout with ES variant
KEYMAPOPTS="es es"

# Set hostname to 'sandbox'
HOSTNAMEOPTS="sandbox"

# Set device manager to mdev
DEVDOPTS=mdev

# Contents of /etc/network/interfaces
INTERFACESOPTS="auto lo
iface lo inet loopback

auto eth0
iface eth0 inet dhcp
hostname sandbox
"

# Search domain of Google and OpenDNS public nameserver
DNSOPTS="-d 8.8.8.8 208.67.222.222"

# Set timezone
TIMEZONEOPTS="-z America/Buenos_Aires"

# Set http/ftp proxy
PROXYOPTS=none

# Add first mirror (CDN)
APKREPOSOPTS="-1"

# Create admin user
USEROPTS="-a -u -g audio,input,video,netdev admin"

# Install Openssh
SSHDOPTS=openssh

# Setup openntpd
NTPOPTS="openntpd"

# Use /dev/vda as a sys disk
DISKOPTS="-m sys /dev/vda"
HEREDOC
```

Run the `setup-alpine` script, using the previously created `answerfile`.

```bash
setup-alpine -f answerfile
```

The installation script will ask for the password for the **root** user and the confirmation to erase the disk to install the system.

Once the installation script finishes, it is time to reboot the VM.

```bash
reboot
```


### Final Tuning

Once Alpine Linux finishes booting, log in with the **root** user and set the password for the **`admin`** user.

```bash
passwd admin
```

We're going to continue enabling the community repositories.

```bash
sed -i -e 's/#http/http/g' /etc/apk/repositories && \
apk update && \
apk upgrade --no-interactive --progress --no-cache --prune && \
apk cache --no-interactive --progress --force purge
```

Next, use the following command to install and set up `sudo`, and to add the `admin` user to the `sudo` group.

```bash
apk add --no-cache sudo && \
sed -i -e 's/^# %sudo.*$/%sudo ALL=(ALL:ALL) NOPASSWD: ALL/' /etc/sudoers && \
addgroup sudo && \
addgroup admin sudo
```

And finish the installation by shutting down the VM.

```bash
history -cw && \
rm .ash_history && \
poweroff
```


Install Extra Software
----------------------

In this section, we're going to install extra software into the Alpine Linux that we have just finished setting up. Specifically, we're going to install Docker.


### Run Alpine Linux {#run-alpine-linux}

Start a VM to run Alpine Linux from the disk image file. In the following command we're going to tell QEMU to not display any output, but the SSH port (`22`) is forwarded to the host port `2222` so we can access the guest OS using an ssh connection.

```bash
qemu-system-x86_64  \
  -machine accel=kvm,type=q35 \
  -cpu host \
  -m 1G \
  -device virtio-net-pci,netdev=net0 \
  -netdev user,id=net0,hostfwd=tcp::2222-:22 \
  -drive if=virtio,format=qcow2,file="${GUEST_IMAGE_FILE}" \
  -nographic \
  -display none
```

Once the VM finish the boot process, we can access it using ssh with the following command.

```bash
ssh -v -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p 2222 admin@localhost
```


### Install Docker {#docker}

Using the following command, we're going to install docker and [docker compose](https://docs.docker.com/compose/).

```bash
sudo apk add --no-cache docker docker-cli-compose
```

Before starting docker, we're going to set up the [remote access](https://docs.docker.com/engine/daemon/remote-access/) to the [daemon](https://en.wikipedia.org/wiki/Daemon_%28computing%29) so it can be accessed from outside of the VM. We're doing this, because we would like to interact with docker from termux (as in [Docker Desktop](https://www.docker.com/products/docker-desktop/) for Windows and Mac). The daemon is exposed through [TCP](https://en.wikipedia.org/wiki/Transmission_Control_Protocol) port `2375`, so remember to update the QEMU command to forward this port to the host machine.

```bash
sudo mkdir -p /etc/docker && \
cat <<HEREDOC | sudo tee /etc/docker/daemon.json
{
  "hosts": ["unix:///var/run/docker.sock", "tcp://0.0.0.0:2375"]
}
HEREDOC
```

Next, set Docker to start when the system boots, start the Docker daemon, and add the current user to the `docker` group so it can use Docker.

```bash
sudo rc-update add docker default && \
sudo service docker start && \
sudo addgroup ${USER} docker
```

Now we're ready to shut down the VM.

```bash
history -cw && \
rm .ash_history && \
sudo poweroff
```


Convert Disk Image {#convert-disk-image}
------------------

In this section we're going to convert the disk image to other formats so it can be used with [VirtualBox](https://www.virtualbox.org/) or [Windows Subsystem for Linux (WSL)](https://learn.microsoft.com/en-us/windows/wsl/install).


### VirtualBox Image (.vdi)

```bash
GUEST_IMAGE_VDI="${GUEST_IMAGE_NAME%.*}.vdi" && \
qemu-img convert -p -f qcow2 -O vdi "${GUEST_IMAGE_NAME}" "${GUEST_IMAGE_VDI}"
```

### WSL Image (.vhdx)

```bash
GUEST_IMAGE_VHDX="${GUEST_IMAGE_NAME%.*}.vhdx" && \
qemu-img convert -p -f qcow2 -O vhdx -o subformat=dynamic "${GUEST_IMAGE_NAME}" "${GUEST_IMAGE_VHDX}"
```


Wrapping Up
-----------

We've accomplished the goal mentioned at the beginning: to create a disk image with Alpine Linux where we could run Docker from Termux (Android). From here, feel free to explore Alpine Linux further, perhaps by installing a [GUI environment](https://wiki.alpinelinux.org/wiki/I3wm) or other tools.

Take care and until next time!
