+++
title = "Alpine en QEMU: Una Guía Práctica Desde Cero"
date = 2025-07-07T20:56:38-03:00
[taxonomies]
tags = ['Alpine Linux', 'Virtualization', 'QEMU', 'Docker']
series = ['Linux Playground From Scratch']
[extra]
add_toc = true
series = true
+++

En este post, vamos a repasar los pasos necesarios para instalar [Alpine Linux](https://alpinelinux.org/) en una máquina virtual. Alpine es una distribución de Linux liviana basada en [musl libc](https://musl.libc.org/) y [busybox](https://busybox.net/). Debido a su mínimo tamaño, se usa comúnmente para crear [imágenes de contenedores](https://opencontainers.org/). Aquí, aprovechando su tamaño, lo usaremos para instalar [Docker](https://en.wikipedia.org/wiki/Docker_%28software%29), buscando una imagen más pequeña de la que obtendríamos usando Debian (como se muestra en el [post anterior](@/blog/2024/12/2024-12-23_-_vm-guest-os-debian.es.md)). El propósito principal de esta imagen es permitirnos ejecutar contenedores desde [Termux](https://en.wikipedia.org/wiki/Termux), lo cual no es posible en un dispositivo Android regular (sin [rootear](https://en.wikipedia.org/wiki/Rooting_%28Android%29)).


Arrancando con  Alpine Linux
----------------------------

Comenzaremos creando un directorio para usarlo como nuestro espacio de trabajo y luego nos moveremos dentro de él.

```bash
mkdir alpine && cd alpine
```


### Descargar Archivos

A continuación, se muestran las variables de entorno utilizadas para [descargar](https://alpinelinux.org/downloads/) los archivos necesarios para configurar la imagen de la VM.

```bash
ALPINE_RELEASE="3.21.3"
ALPINE_VERSION="v${ALPINE_RELEASE%.*}"
ALPINE_TYPE="virt"
ALPINE_ARCH="x86_64"
ALPINE_CD_FILE="alpine-${ALPINE_TYPE}-${ALPINE_RELEASE}-${ALPINE_ARCH}.iso"
```

Usando esos valores, descarga los archivos con [cURL](https://en.wikipedia.org/wiki/CURL). Hemos seleccionado el [medio de instalación](https://docs.alpinelinux.org/user-handbook/0.1a/Installing/medium.html) para la arquitectura **Intel/AMD de 64 bits** y el tipo de imagen **virtual**.

```bash
curl -LO "https://alpinelinux.org/keys/ncopa.asc" && \
curl -LO "https://dl-cdn.alpinelinux.org/alpine/${ALPINE_VERSION}/releases/${ALPINE_ARCH}/alpine-${ALPINE_TYPE}-${ALPINE_RELEASE}-${ALPINE_ARCH}.iso" && \
curl -LO "https://dl-cdn.alpinelinux.org/alpine/${ALPINE_VERSION}/releases/${ALPINE_ARCH}/alpine-${ALPINE_TYPE}-${ALPINE_RELEASE}-${ALPINE_ARCH}.iso.sha256" && \
curl -LO "https://dl-cdn.alpinelinux.org/alpine/${ALPINE_VERSION}/releases/${ALPINE_ARCH}/alpine-${ALPINE_TYPE}-${ALPINE_RELEASE}-${ALPINE_ARCH}.iso.asc"
```


### Integridad y Autenticidad de los Archivos {#files-integrity-and-authenticity}

Uno de los archivos descargados contiene un hash criptográfico [SHA-2](https://en.wikipedia.org/wiki/SHA-2) que podemos usar para verificar la integridad y autenticidad del archivo [`iso`](https://en.wikipedia.org/wiki/Optical_disc_image).

```bash
sha256sum --check "alpine-${ALPINE_TYPE}-${ALPINE_RELEASE}-${ALPINE_ARCH}.iso.sha256"
```

Otra forma de verificar el archivo es usando [GPG](https://en.wikipedia.org/wiki/GNU_Privacy_Guard). Primero, verifica que el archivo con la clave GPG tenga la huella digital correcta. Podés encontrarla en la página de descarga. Al momento de escribir esto, la huella digital es `0482 D840 22F5 2DF1 C4E7 CD43 293A CD09 07D9 495A`.

```bash
gpg --with-fingerprint --dry-run ncopa.asc | grep --only-matching --extended-regexp '[0-9A-F][0-9A-F ]{49,50}'
```

Luego importá la clave GPG.

```bash
gpg --import ncopa.asc
```

A continuación, podés verificar el archivo ISO.

```bash
gpg --verify "alpine-${ALPINE_TYPE}-${ALPINE_RELEASE}-${ALPINE_ARCH}.iso.asc" "alpine-${ALPINE_TYPE}-${ALPINE_RELEASE}-${ALPINE_ARCH}.iso"
```

Deberías ver una salida similar a la siguiente.

```text
gpg: Signature made jue 13 feb 2025 20:58:06 -03 using RSA key ID 07D9495A
gpg: Good signature from "Natanael Copa <ncopa@alpinelinux.org>"
gpg: WARNING: This key is not certified with a trusted signature!
gpg:          There is no indication that the signature belongs to the owner.
Primary key fingerprint: 0482 D840 22F5 2DF1 C4E7  CD43 293A CD09 07D9 495A
```

La advertencia indica que la firma no es de confianza. Vamos a solucionar eso.

```bash
gpg --edit-key 'ncopa@alpinelinux.org'
```

Luego seleccioná `trust`, elegí la opción `5` ('I trust ultimately') y luego `quit`.

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

Al verificar el archivo de nuevo, se debería mostrar algo como lo siguiente.

```text
gpg: Signature made jue 13 feb 2025 20:58:06 -03 using RSA key ID 07D9495A
gpg: checking the trustdb
gpg: 3 marginal(s) needed, 1 complete(s) needed, PGP trust model
gpg: depth: 0  valid:   1  signed:   0  trust: 0-, 0q, 0n, 0m, 0f, 1u
gpg: Good signature from "Natanael Copa <ncopa@alpinelinux.org>"
```


### Crear Imagen de Disco

A partir de este punto, los siguientes comandos usarán el emulador de máquina y virtualizador [QEMU](https://www.qemu.org/), versión **2.5.0**.

```bash
qemu-system-x86_64 --version
# > QEMU emulator version 2.5.0 (Debian 1:2.5+dfsg-5ubuntu10.51+esm3), Copyright (c) 2003-2008 Fabrice Bellard
```

Establecé las variables de entorno que usaremos en los siguientes pasos.

```bash
GUEST_IMAGE_SIZE="5G"
GUEST_IMAGE_FILE="alpine-${ALPINE_RELEASE}-${ALPINE_ARCH}.qcow2"
```

Creá la imagen de disco [Qemu Qcow2](https://en.wikipedia.org/wiki/Qcow). Una de las principales características de este tipo de imagen es que crecerá a medida que se añadan datos, optimizando el espacio de almacenamiento y mejorando la flexibilidad. Esta función permite a los usuarios comenzar con una imagen pequeña, expandiéndola según sea necesario sin desperdiciar recursos.

```bash
qemu-img create -f qcow2 "${GUEST_IMAGE_FILE}" "${GUEST_IMAGE_SIZE}"
```


### Instalar Alpine Linux {#install-alpine-linux}

Iniciá la máquina virtual usando el ISO de Alpine Linux y la imagen de disco creada.

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

Esperá hasta que la VM arranque e iniciá sesión como el usuario **`root`** cuando se te solicite.

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

Para automatizar el proceso de configuración, vamos a crear un [archivo de respuestas](https://docs.alpinelinux.org/user-handbook/0.1a/Installing/setup_alpine.html#_answer_files) que contenga valores personalizados para las preguntas del script de instalación, ahorrando tiempo y asegurando consistencia. Si encuentras que alguna opción no se ajusta a tus necesidades, puedes comentarla o modificarla.

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

Ejecutá el script `setup-alpine`, usando el `answerfile` creado anteriormente.

```bash
setup-alpine -f answerfile
```

El script de instalación te pedirá la contraseña para el usuario **root** y la confirmación para borrar el disco para instalar el sistema.

Una vez que el script de instalación termine, es hora de reiniciar la VM.

```bash
reboot
```


### Ajustes Finales

Una vez que Alpine Linux termine de arrancar, iniciá sesión con el usuario **root** y establecé la contraseña para el usuario **`admin`**.

```bash
passwd admin
```

Vamos a continuar habilitando los repositorios de la comunidad.

```bash
sed -i -e 's/#http/http/g' /etc/apk/repositories && \
apk update && \
apk upgrade --no-interactive --progress --no-cache --prune && \
apk cache --no-interactive --progress --force purge
```

Luego utiliza el siguiente comando para instalar y configurar `sudo` y luego añadir el usuario `admin` al grupo `sudo`.

```bash
apk add --no-cache sudo && \
sed -i -e 's/^# %sudo.*$/%sudo ALL=(ALL:ALL) NOPASSWD: ALL/' /etc/sudoers && \
addgroup sudo && \
addgroup admin sudo
```

Y finalizá la instalación apagando la VM.

```bash
history -cw && \
rm .ash_history && \
poweroff
```


Instalar Software Extra
-----------------------

En esta sección, vamos a instalar software adicional en el Alpine Linux que acabamos de configurar. Específicamente, vamos a instalar Docker.


### Ejecutar Alpine Linux {#run-alpine-linux}

Iniciá una VM para ejecutar Alpine Linux desde el archivo de imagen de disco. En el siguiente comando le vamos a decir a QEMU que no muestre ninguna salida, pero el puerto SSH (`22`) se reenvía al puerto del host `2222` para que podamos acceder al sistema operativo invitado usando una conexión ssh.

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

Una vez que la VM termine el proceso de arranque, podemos acceder a ella usando ssh con el siguiente comando.

```bash
ssh -v -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p 2222 admin@localhost
```


### Instalar Docker {#docker}

Usando el siguiente comando, vamos a instalar docker y [docker compose](https://docs.docker.com/compose/).

```bash
sudo apk add --no-cache docker docker-cli-compose
```

Antes de iniciar docker, vamos a configurar el [acceso remoto](https://docs.docker.com/engine/daemon/remote-access/) al [daemon](https://en.wikipedia.org/wiki/Daemon_%28computing%29) para que se pueda acceder desde fuera de la VM. Estamos haciendo esto porque nos gustaría interactuar con docker desde termux (como en [Docker Desktop](https://www.docker.com/products/docker-desktop/) para Windows y Mac). El daemon se expone a través del puerto [TCP](https://en.wikipedia.org/wiki/Transmission_Control_Protocol) `2375`, así que recordá actualizar el comando QEMU para reenviar este puerto a la máquina host.

```bash
sudo mkdir -p /etc/docker && \
cat <<HEREDOC | sudo tee /etc/docker/daemon.json
{
  "hosts": ["unix:///var/run/docker.sock", "tcp://0.0.0.0:2375"]
}
HEREDOC
```

Luego configura Docker para que se inicie cuando el sistema arranque, inicia el daemon de Docker y añade el usuario actual al grupo `docker` para que pueda usar Docker.

```bash
sudo rc-update add docker default && \
sudo service docker start && \
sudo addgroup ${USER} docker
```

Ahora estamos listos para apagar la VM.

```bash
history -cw && \
rm .ash_history && \
sudo poweroff
```


Convertir Imagen de Disco {#convert-disk-image}
-------------------------

En esta sección vamos a convertir la imagen de disco a otros formatos para que pueda usarse con [VirtualBox](https://www.virtualbox.org/) o [Windows Subsystem for Linux (WSL)](https://learn.microsoft.com/en-us/windows/wsl/install).


### Imagen para VirtualBox (.vdi)

```bash
GUEST_IMAGE_VDI="${GUEST_IMAGE_NAME%.*}.vdi" && \
qemu-img convert -p -f qcow2 -O vdi "${GUEST_IMAGE_NAME}" "${GUEST_IMAGE_VDI}"
```

### Imagen para WSL (.vhdx)

```bash
GUEST_IMAGE_VHDX="${GUEST_IMAGE_NAME%.*}.vhdx" && \
qemu-img convert -p -f qcow2 -O vhdx -o subformat=dynamic "${GUEST_IMAGE_NAME}" "${GUEST_IMAGE_VHDX}"
```


Finalizando
-----------

Hemos logrado el objetivo mencionado al principio: crear una imagen de disco con Alpine Linux donde podamos ejecutar Docker desde Termux (Android). A partir de aquí, siéntete libre de explorar más a fondo Alpine Linux, quizás instalando un [entorno gráfico](https://wiki.alpinelinux.org/wiki/I3wm) u otras herramientas.

¡Saludos y hasta la próxima!
