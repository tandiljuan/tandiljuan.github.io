+++
title = "Set up Debian as a guest OS for a VM"
date = 2024-12-23T20:40:22-03:00
[taxonomies]
categories = ['GNU/Linux','System Administration','Virtualization']
tags = ['Bash Script','Debian','Disk Image','Keyboard','Network','QEMU','SSH','VirtualBox','WSL']
[extra]
add_toc = true
+++

In the last few years, I have been teaching an introduction to GNU/Linux, Bash, Bash Script, the very basics of VIM, and git. The main issue I encountered during the course was the lack of a common platform for everyone to practice what was learned. Not everyone uses a GNU/Linux distribution or knows how to install it. So, I came up with the idea of setting up a disk image with a preinstalled Debian OS that could be loaded in a virtual machine (QEMU, VirtualBox, or WSL). This guide contains all the steps I followed to create it, and at the time I wrote it, the host OS was Ubuntu 16.04 (Xenial).


Bootstrap Debian OS
-------------------

First, it's necessary to set some environment variables that will be used throughout the rest of this guide. In these variables, we will define the size (in gibibytes) of the disk image (where the guest OS will be installed), the image name, the image path, and the guest OS hostname.

```bash
GUEST_IMAGE_GB=2
GUEST_IMAGE_NAME="disk_image.raw"
GUEST_MOUNT_PATH="./disk_mount"
GUEST_HOSTNAME='sandbox'
```

Once we have the variables set, we need to create the disk image.

```bash
dd if=/dev/zero of="${GUEST_IMAGE_NAME}" iflag=fullblock bs=1M count=$(( 1024 * $GUEST_IMAGE_GB )) && sync
```

Using the `fdisk` tool, create the partition table in the disk image. The options will be `n` to create a new partition, `p` to make it primary, `1` to set it as the first partition, accept the following two default values, `a` to set the bootable flag, and `w` to write the changes and exit.

```bash
fdisk "${GUEST_IMAGE_NAME}"
> n
> p
> 1
> (default)
> (default)
> a
> w
```

Mount the image using a loop device and save the device path in an environment variable.

```bash
GUEST_LOOP_DEV=$(sudo losetup --partscan --find --show "${GUEST_IMAGE_NAME}") && echo $GUEST_LOOP_DEV
# [example] > /dev/loop0
```

Create an `ext4` file system in the first partition that was just created.

```bash
sudo mkfs.ext4 "${GUEST_LOOP_DEV}p1"
```

Create a directory to mount the file system and then mount it.

```bash
mkdir "${GUEST_MOUNT_PATH}"
sudo mount "${GUEST_LOOP_DEV}p1" "${GUEST_MOUNT_PATH}"
```

Bootstrap a basic Debian (**bullseye**) system, including only essential packages (**minbase**) and setting the **amd64** architecture.

```bash
sudo debootstrap --arch=amd64 --variant=minbase bullseye "${GUEST_MOUNT_PATH}"
```

After the previous command, the system should have a size of approximately 220 megabytes. However, at the moment, the system is incomplete. It doesn't have the kernel, the boot loader, the initialization process to bootstrap the system, or the network manager.

Get the partition's UUID, define the partition's label, and set it.

```bash
GUEST_P1_UUID=$(lsblk -no UUID "${GUEST_LOOP_DEV}p1") && echo $GUEST_P1_UUID
GUEST_P1_LABEL="${GUEST_HOSTNAME}-root" && echo "${GUEST_P1_LABEL}"
sudo e2label "${GUEST_LOOP_DEV}p1" "${GUEST_P1_LABEL}"
```

Set the `fstab` configuration file for the guest OS.

```bash
cat <<HEREDOC | sudo tee "${GUEST_MOUNT_PATH}/etc/fstab"
# UNCONFIGURED FSTAB FOR BASE SYSTEM
# <file system>  <dir>  <type>  <options>  <dump>  <pass>
LABEL=${GUEST_P1_LABEL}    /    ext4    defaults    0       0
HEREDOC
```

Set the hostname for the guest OS.

```bash
echo "${GUEST_HOSTNAME}" | sudo tee "${GUEST_MOUNT_PATH}/etc/hostname"
```

Set the `hosts` configuration file for the guest OS.

```bash
cat <<HEREDOC | sudo tee "${GUEST_MOUNT_PATH}/etc/hosts"
127.0.0.1 localhost
127.0.1.1 ${GUEST_HOSTNAME}

# The following lines are desirable for IPv6 capable hosts
::1     localhost ip6-localhost ip6-loopback
ff02::1 ip6-allnodes
ff02::2 ip6-allrouters
HEREDOC
```

Save the environment variables in a file to be loaded and used from inside the guest OS.

```bash
cat <<HEREDOC | sudo tee "${GUEST_MOUNT_PATH}/guest.env"
GUEST_HOSTNAME=${GUEST_HOSTNAME}
GUEST_LOOP_DEV=${GUEST_LOOP_DEV}
GUEST_P1_LABEL=${GUEST_P1_LABEL}
GUEST_P1_UUID=${GUEST_P1_UUID}
HEREDOC
```

Change root into the guest OS mount path.

```bash
sudo mount --bind /dev "${GUEST_MOUNT_PATH}/dev" && \
sudo mount --bind /proc "${GUEST_MOUNT_PATH}/proc" && \
sudo mount --bind /sys "${GUEST_MOUNT_PATH}/sys" && \
sudo mount --bind /dev/pts "${GUEST_MOUNT_PATH}/dev/pts" && \
sudo chroot "${GUEST_MOUNT_PATH}"
```

Load and check the environment variables.

```bash
source guest.env && \
echo "GUEST_HOSTNAME=${GUEST_HOSTNAME}" && \
echo "GUEST_LOOP_DEV=${GUEST_LOOP_DEV}" && \
echo "GUEST_P1_LABEL=${GUEST_P1_LABEL}" && \
echo "GUEST_P1_UUID=${GUEST_P1_UUID}"
```

Update the list of available packages and install only the ones needed to have a bootable system.

```bash
apt update && \
apt install --no-install-recommends \
    grub-pc \
    init \
    linux-image-cloud-amd64 \
    network-manager
```

Update the GRUB configuration file to have no timeouts and to start the system immediately.

```bash
sed -i -e 's/GRUB_TIMEOUT=.*/GRUB_TIMEOUT=0/g' /etc/default/grub
sed -i -e 's/GRUB_CMDLINE_LINUX_DEFAULT=.*/GRUB_CMDLINE_LINUX_DEFAULT=""/g' /etc/default/grub
cat >> /etc/default/grub <<HEREDOC

# Instant start with no delay
GRUB_TIMEOUT_STYLE=hidden
GRUB_HIDDEN_TIMEOUT=0
GRUB_HIDDEN_TIMEOUT_QUIET=true
GRUB_RECORDFAIL_TIMEOUT=0
GRUB_DISABLE_OS_PROBER=true
HEREDOC
```

Install and update GRUB.

```bash
grub-install "${GUEST_LOOP_DEV}" && \
update-grub
```

Update the GRUB boot configuration file and replace the partition's UUID with the label we set previously.

```bash
sed -i -e "s/UUID=${GUEST_P1_UUID}/LABEL=${GUEST_P1_LABEL}/g" /boot/grub/grub.cfg
```

Set the password for the user **root**.

```bash
passwd
```

Remove unused packages (`autoremove`), clear retrieved packages in the local repository (`autoclean`), and clean the `/var/cache` directory (`clean`).

```bash
apt-get autoremove && \
apt-get autoclean && \
apt-get clean
```

Remove the file with the environment variables and exit from the chroot environment.

```bash
rm /guest.env && \
exit
```

Unmount everything and free the loop device.

```bash
sudo umount "${GUEST_MOUNT_PATH}/dev/pts" && \
sudo umount "${GUEST_MOUNT_PATH}/dev" && \
sudo umount "${GUEST_MOUNT_PATH}/proc" && \
sudo umount "${GUEST_MOUNT_PATH}/sys" && \
sudo umount "${GUEST_MOUNT_PATH}" && \
sudo losetup -d "${GUEST_LOOP_DEV}"
```

At this point, the system should have a size of approximately 430 megabytes.

Now it's time to boot the guest OS using a `qemu` VM and check if it's working as expected.

```bash
qemu-system-x86_64  \
  -machine accel=kvm,type=q35 \
  -cpu host \
  -m 1G \
  -device virtio-net-pci,netdev=net0 \
  -netdev user,id=net0 \
  -drive if=virtio,format=raw,file="${GUEST_IMAGE_NAME}"
```

Once the VM finishes booting the guest OS, you need to log in with the `root` user and check if the network is working using the `apt update` command (which downloads package information). If there are network issues, it might be necessary to change the default `-netdev` settings. Below is a list of the ones that could be changed (from `man qemu-system-x86_64`).

```man
restrict=on|off
    If this option is enabled, the guest will be isolated, i.e. it will not be able to contact the host and no guest IP packets will be routed over the host to
    the outside. This option does not affect any explicitly set forwarding rules.

net=addr[/mask]
    Set IP network address the guest will see. Optionally specify the netmask, either in the form a.b.c.d or as number of valid top-most bits. Default is
    10.0.2.0/24.

host=addr
    Specify the guest-visible address of the host. Default is the 2nd IP in the guest network, i.e. x.x.x.2.

dns=addr
    Specify the guest-visible address of the virtual nameserver. The address must be different from the host address. Default is the 3rd IP in the guest network,
    i.e. x.x.x.3.

dhcpstart=addr
    Specify the first of the 16 IPs the built-in DHCP server can assign. Default is the 15th to 31st IP in the guest network, i.e. x.x.x.15 to x.x.x.31.

hostname=name
    Specifies the client hostname reported by the built-in DHCP server.

dnssearch=domain
    Provides an entry for the domain-search list sent by the built-in DHCP server. More than one domain suffix can be transmitted by specifying this option
    multiple times. If supported, this will cause the guest to automatically try to append the given domain suffix(es) in case a domain name can not be resolved.
```

Below is an example of the `-netdev` option with the previous settings, with some values changed.

```bash
  -netdev user,id=net0,restrict=off,net=192.168.10.0/24,host=192.168.10.2,dns=192.168.10.3,dhcpstart=192.168.10.5,hostname=guestvm,dnssearch=8.8.8.8 \
```

If the VM is not working as expected and you need to make some updates, here is a shorthand command to change root again into the guest file system.

```bash
GUEST_LOOP_DEV=$(sudo losetup --partscan --find --show "${GUEST_IMAGE_NAME}") && \
echo $GUEST_LOOP_DEV && \
sudo mount "${GUEST_LOOP_DEV}p1" "${GUEST_MOUNT_PATH}" && \
sudo mount --bind /dev "${GUEST_MOUNT_PATH}/dev" && \
sudo mount --bind /proc "${GUEST_MOUNT_PATH}/proc" && \
sudo mount --bind /sys "${GUEST_MOUNT_PATH}/sys" && \
sudo mount --bind /dev/pts "${GUEST_MOUNT_PATH}/dev/pts" && \
sudo chroot "${GUEST_MOUNT_PATH}"
```


Recommended Software Tools
--------------------------


### SSH Server

To facilitate the connection to the guest VM, we can install an SSH server. This will allow us to log in to the guest OS from our host machine or any other computer on the network, using more convenient tools that will make *copy and paste* easier.

I have chosen `dropbear`, which is a relatively small SSH server (and client). It weighs around 1800 kilobytes.

```bash
apt install --no-install-recommends \
    dropbear
```

After the SSH server installation, it is necessary to update the **QEMU** `-netdev` option to allow the connection. This will be done by forwarding a port from the host to a port in the guest. The configuration is done through the `hostfwd` setting.

```man
hostfwd=[tcp|udp]:[hostaddr]:hostport-[guestaddr]:guestport
    Redirect incoming TCP or UDP connections to the host port hostport to the guest IP address guestaddr on guest port guestport. If guestaddr is not specified,
    its value is x.x.x.15 (default first address given by the built-in DHCP server). By specifying hostaddr, the rule can be bound to a specific host interface.
    If no connection type is set, TCP is used. This option can be given multiple times.
```

Here is an example of the `-netdev` option with the `hostfwd` setting. The host port `2222` will forward to the guest port `22` (the default SSH server port).

```bash
  -netdev user,id=net0,hostfwd=tcp::2222-:22 \
```

From this point, we can use an SSH client to log into the guest OS. Therefore, other **QEMU** options that might be useful are `-display none` and `-nographic`.

```man
-display type
    Select type of display to use. This option is a replacement for the old style -sdl/-curses/... options. Valid values for type are

    none
        Do not display video output. The guest will still see an emulated graphics card, but its output will not be displayed to the QEMU user. This option differs
        from the -nographic option in that it only affects what is done with video output; -nographic also changes the destination of the serial and parallel port
        data.

-nographic
    Normally, QEMU uses SDL to display the VGA output. With this option, you can totally disable graphical output so that QEMU is a simple command line application.
    The emulated serial port is redirected on the console and muxed with the monitor (unless redirected elsewhere explicitly). Therefore, you can still use QEMU to
    debug a Linux kernel with a serial console.  Use C-a h for help on switching between the console and monitor.
```

Below is the updated **QEMU** command with the above settings.

```bash
qemu-system-x86_64  \
  -machine accel=kvm,type=q35 \
  -cpu host \
  -m 1G \
  -device virtio-net-pci,netdev=net0 \
  -netdev user,id=net0,hostfwd=tcp::2222-:22 \
  -drive if=virtio,format=raw,file="${GUEST_IMAGE_NAME}" \
  -display none \
  -nographic
```

Now we can access the guest OS through an SSH connection. Keep in mind that `localhost` needs to be replaced with the host IP if the connection is being made from another computer on the same network. The `-p` option defines the open port on the host machine (that we set above), the `-v` option adds verbosity, and the `-o` options are used to not check the guest SSH keys (as we are going to trust our guest OS).

```bash
ssh -v -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p 2222 root@localhost
```


### Nice-to-have software tools

Here is a list of tools that I like to have. The installation of all these tools will increase the system size by approximately 9000 kilobytes.

* `procps`: Provides utilities for **procfs** (a pseudo file system with information about the process table). It contains `free`, `kill`, `pkill`, `pgrep`, `pmap`, `ps`, `pwdx`, `skill`, `slabtop`, `snice`, `sysctl`, `tload`, `top`, `uptime`, `vmstat`, `w`, and `watch`.
* `less`: A file pager utility for displaying text one screen at a time. It is the newest and improved version of `more`.
* `sudo`: A tool to give limited root privileges to normal users.
* `tmux`: A terminal multiplexer that enables multiple terminals to be accessed and controlled from a single terminal.

```bash
apt install --no-install-recommends \
    less \
    procps \
    sudo \
    tmux
```

With `sudo`, we can stop using the **root** user and create a normal user (**admin**). Once it's created, we can grant it root privileges by adding the `admin` user to the `sudo` group. Then, we can update the **sudo** configuration file to allow the **admin** user to use the `sudo` command without a password.

```bash
adduser admin && \
adduser admin sudo && \
sed -i -e 's/^%sudo.*/%sudo ALL=(ALL) NOPASSWD: ALL/g' /etc/sudoers
```

Now we can log out and log in again with the new user, and we can check that everything is working fine by trying to gain root privileges with the command `sudo su`.


### Network tools

Here is a short list of network tools that I like to have on hand:

* `curl`: A command line tool for transferring data with URL syntax.
* `inetutils-telnet`: A Telnet client.
* `iputils-ping`: A tool to test the reachability of network hosts.
* `netcat`: A tool for reading from and writing to network connections using TCP or UDP.
* `lft`: [Layer four traceroute](https://en.wikipedia.org/wiki/Layer_four_traceroute).

The next command will install these network tools and increase the system size by approximately 2900 kilobytes.

```bash
apt install --no-install-recommends \
    curl \
    inetutils-telnet \
    iputils-ping \
    netcat \
    lft
```

**IMPORTANT!**: Any ICMP protocol, such as the one used by the `ping` command, won't work with **QEMU** in user mode networking.

Here is an example of how to trace the route for ICMP and TCP protocols with the `lft` command.

```bash
lft -p google.com # ICMP
lft -b google.com # TCP
```


### Text editor

Because I use `vim` on a daily basis, the `vim-tiny` package is a good option with a favorable cost/benefit ratio (approximately 2200 kilobytes). Another (very) small alternative could be `levee`. However, if size isn't a concern, I recommend `neovim`.

```bash
apt install --no-install-recommends \
    vim-tiny
```


### Nice-to-have system tools

With the next command, we're going to install the following packages that will improve our user experience. After the installation, the system will grow by approximately 30 megabytes.

* `bash-completion`: Bash completion extends Bash's standard completion behavior to achieve complex command lines with just a few keystrokes.
* `locales`: Machine-readable data files, shared objects, and programs used by the C library for localization (l10n) and internationalization (i18n) support.
* `man-db`: This package provides the `man` command, the primary way of examining the system help files (manual pages).

```bash
apt install --no-install-recommends \
    bash-completion \
    locales \
    man-db
```


### Setup keyboard

I have a Spanish keyboard, and the following instructions are to configure it and set up the system's locales. These instructions may also be useful if you have a keyboard for a different language. However, if you have an English keyboard, you can likely ignore this section and skip to the next one. This setup will increase the system size by approximately 13 megabytes.

First, install the packages to set up the [keyboard](https://wiki.debian.org/Keyboard).

```bash
sudo apt install --no-install-recommends \
    keyboard-configuration \
    console-setup
```

The installation process will initiate the keyboard configuration process. I selected **22**, **84**, and **6**.

```bash
> 22. Other
> 84. Spanish
>  6. Spanish - Spanish (Win keys)
```

Next, it will start the console configuration process. I selected **27** and **23**.

```bash
> 27. UTF-8
> 23. Guess optimal character set
```

Once the package installation ends, it is necessary to reconfigure the system locales, where I selected **181** and **2**.

```bash
sudo dpkg-reconfigure locales
> 181. es_ES.UTF-8 UTF-8
>   2. C.UTF-8
```

The last steps are to set up the console, update the `initramfs` image, and reboot the system.

```bash
sudo setupcon
sudo update-initramfs -u
sudo reboot
```


Convert Disk Image
------------------

Once we're satisfied with the state of the guest OS, it's time to convert the raw image into a `qcow2` format. This format supports compression, will have the size of its content, and will grow as the content grows. To do this, run the following command.

```bash
GUEST_IMAGE_QCOW="$(basename "${GUEST_IMAGE_NAME}" | cut -d'.' -f1).qcow2" && \
qemu-img convert -c -p -f raw -O qcow2 "${GUEST_IMAGE_NAME}" "${GUEST_IMAGE_QCOW}"
```

In my process, the new disk image has a size of approximately 310 megabytes.

Now we can run the VM using the new image with the following **QEMU** command.

```bash
qemu-system-x86_64  \
  -machine accel=kvm,type=q35 \
  -cpu host \
  -m 1G \
  -device virtio-net-pci,netdev=net0 \
  -netdev user,id=net0,hostfwd=tcp::2222-:22 \
  -drive if=virtio,format=qcow2,file="${GUEST_IMAGE_QCOW}"
```

We can also convert it to the format used by VirtualBox.

```bash
GUEST_IMAGE_VDI="$(basename "${GUEST_IMAGE_NAME}" | cut -d'.' -f1).vdi" && \
qemu-img convert -p -f raw -O vdi "${GUEST_IMAGE_NAME}" "${GUEST_IMAGE_VDI}"
```

We can also convert it to the format used by WSL (Microsoft Hyper-V VHDX format).

```bash
GUEST_IMAGE_VHDX="$(basename "${GUEST_IMAGE_NAME}" | cut -d'.' -f1).vhdx" && \
qemu-img convert -p -f raw -O vhdx "${GUEST_IMAGE_NAME}" "${GUEST_IMAGE_VHDX}"
```

Then you can import the `vhdx` file with this command ([@see](https://superuser.com/a/1667985)).

```PowerShell
wsl --import-in-place [DISTRIBUTION_NAME] [FILE_NAME]
```
