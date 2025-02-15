+++
title = "Configurando Debian para correrlo en una VM"
date = 2024-12-23T20:40:22-03:00
[taxonomies]
categories = ['GNU/Linux','System Administration','Virtualization']
tags = ['Bash Script','Debian','Disk Image','Keyboard','Network','QEMU','SSH','VirtualBox','WSL']
[extra]
add_toc = true
+++

En los últimos años, he estado enseñando introducción a GNU/Linux, Bash, Bash Script, los conceptos básicos de VIM y Git. El principal problema que encontré durante el curso fue la falta de una plataforma común para que todos pudieran practicar lo que habían aprendido. No todos utilizan una distribución de GNU/Linux o saben cómo instalarla. Así que se me ocurrió la idea de configurar una imagen de disco con un sistema operativo Debian preinstalado que pudiera cargarse en una máquina virtual (QEMU, VirtualBox o WSL). Esta guía contiene todos los pasos que seguí para crearla, y en el momento en que la escribí, el sistema operativo anfitrión era Ubuntu 16.04 (Xenial).


Bootstrap del SO Debian
-----------------------

Primero, es necesario establecer algunas variables de entorno que se utilizarán a lo largo del resto de esta guía. En estas variables, definiremos el tamaño (en gibibytes) de la imagen de disco (donde se instalará el sistema operativo), el nombre de la imagen, la ruta de la imagen y el nombre de host del SO a virtualizar.

```bash
GUEST_IMAGE_GB=2
GUEST_IMAGE_NAME="disk_image.raw"
GUEST_MOUNT_PATH="./disk_mount"
GUEST_HOSTNAME='sandbox'
```

Una vez que tengamos las variables establecidas, necesitamos crear la imagen de disco.

```bash
dd if=/dev/zero of="${GUEST_IMAGE_NAME}" iflag=fullblock bs=1M count=$(( 1024 * $GUEST_IMAGE_GB )) && sync
```

Usando la herramienta `fdisk`, crea la tabla de particiones en la imagen de disco. Las opciones serán `n` para crear una nueva partición, `p` para hacerla primaria, `1` para establecerla como la primera partición, acepta los siguientes dos valores predeterminados, `a` para establecer la bandera de arranque y `w` para escribir los cambios y salir.

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

Monta la imagen utilizando un dispositivo 'loop' y guarda la ruta del dispositivo en una variable de entorno.

```bash
GUEST_LOOP_DEV=$(sudo losetup --partscan --find --show "${GUEST_IMAGE_NAME}") && echo $GUEST_LOOP_DEV
# [example] > /dev/loop0
```

Crea un sistema de archivos `ext4` en la primera partición que se acaba de crear.

```bash
sudo mkfs.ext4 "${GUEST_LOOP_DEV}p1"
```

Crea un directorio para montar el sistema de archivos y luego móntalo.

```bash
mkdir "${GUEST_MOUNT_PATH}"
sudo mount "${GUEST_LOOP_DEV}p1" "${GUEST_MOUNT_PATH}"
```

Inicializa un sistema básico de Debian (**bullseye**), incluyendo solo los paquetes esenciales (**minbase**) y usando la arquitectura **amd64**.

```bash
sudo debootstrap --arch=amd64 --variant=minbase bullseye "${GUEST_MOUNT_PATH}"
```

Después del comando anterior, el sistema debería tener un tamaño de aproximadamente 220 megabytes. Sin embargo, en este momento, el sistema está incompleto. No tiene el kernel, el cargador de arranque, el proceso para iniciar el sistema o el administrador de red.

Obtén el UUID de la partición, define la etiqueta de la partición y configúrala.

```bash
GUEST_P1_UUID=$(lsblk -no UUID "${GUEST_LOOP_DEV}p1") && echo $GUEST_P1_UUID
GUEST_P1_LABEL="${GUEST_HOSTNAME}-root" && echo "${GUEST_P1_LABEL}"
sudo e2label "${GUEST_LOOP_DEV}p1" "${GUEST_P1_LABEL}"
```

Configura el archivo `fstab` (tabla de sistemas de archivos) para el sistema operativo. En este archivo se listan las particiones disponibles.

```bash
cat <<HEREDOC | sudo tee "${GUEST_MOUNT_PATH}/etc/fstab"
# UNCONFIGURED FSTAB FOR BASE SYSTEM
# <file system>  <dir>  <type>  <options>  <dump>  <pass>
LABEL=${GUEST_P1_LABEL}    /    ext4    defaults    0       0
HEREDOC
```

Establece el nombre de host para el SO huésped.

```bash
echo "${GUEST_HOSTNAME}" | sudo tee "${GUEST_MOUNT_PATH}/etc/hostname"
```

Configura el archivo `hosts` para el SO huésped.

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

Guarda las variables de entorno en un archivo que se cargará y utilizará desde dentro del SO huésped.

```bash
cat <<HEREDOC | sudo tee "${GUEST_MOUNT_PATH}/guest.env"
GUEST_HOSTNAME=${GUEST_HOSTNAME}
GUEST_LOOP_DEV=${GUEST_LOOP_DEV}
GUEST_P1_LABEL=${GUEST_P1_LABEL}
GUEST_P1_UUID=${GUEST_P1_UUID}
HEREDOC
```

Cambia la raíz al directorio de montaje del SO huésped.

```bash
sudo mount --bind /dev "${GUEST_MOUNT_PATH}/dev" && \
sudo mount --bind /proc "${GUEST_MOUNT_PATH}/proc" && \
sudo mount --bind /sys "${GUEST_MOUNT_PATH}/sys" && \
sudo mount --bind /dev/pts "${GUEST_MOUNT_PATH}/dev/pts" && \
sudo chroot "${GUEST_MOUNT_PATH}"
```

Carga y verifica las variables de entorno.

```bash
source guest.env && \
echo "GUEST_HOSTNAME=${GUEST_HOSTNAME}" && \
echo "GUEST_LOOP_DEV=${GUEST_LOOP_DEV}" && \
echo "GUEST_P1_LABEL=${GUEST_P1_LABEL}" && \
echo "GUEST_P1_UUID=${GUEST_P1_UUID}"
```

Actualiza la lista de paquetes disponibles e instala solo los necesarios para tener un sistema operativo funcional.

```bash
apt update && \
apt install --no-install-recommends \
    grub-pc \
    init \
    linux-image-cloud-amd64 \
    network-manager
```

Actualiza el archivo de configuración de GRUB para que no tenga tiempos de espera y para que el sistema se inicie de inmediato.

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

Instala y actualiza GRUB.

```bash
grub-install "${GUEST_LOOP_DEV}" && \
update-grub
```

Actualiza el archivo de configuración de arranque de GRUB y reemplaza el UUID de la partición con la etiqueta que configuramos anteriormente.

```bash
sed -i -e "s/UUID=${GUEST_P1_UUID}/LABEL=${GUEST_P1_LABEL}/g" /boot/grub/grub.cfg
```

Establece la contraseña para el usuario **root**.

```bash
passwd
```

Elimina los paquetes no utilizados (`autoremove`), limpia los paquetes descargados en el repositorio local (`autoclean`) y limpia el directorio `/var/cache` (`clean`).

```bash
apt-get autoremove && \
apt-get autoclean && \
apt-get clean
```

Elimina el archivo con las variables de entorno y sal del entorno chroot.

```bash
rm /guest.env && \
exit
```

Desmonta todo y libera el dispositivo loop.

```bash
sudo umount "${GUEST_MOUNT_PATH}/dev/pts" && \
sudo umount "${GUEST_MOUNT_PATH}/dev" && \
sudo umount "${GUEST_MOUNT_PATH}/proc" && \
sudo umount "${GUEST_MOUNT_PATH}/sys" && \
sudo umount "${GUEST_MOUNT_PATH}" && \
sudo losetup -d "${GUEST_LOOP_DEV}"
```

En este punto, el sistema debería tener un tamaño de aproximadamente 430 megabytes.

Ahora es el momento de arrancar el SO huésped utilizando una máquina virtual `qemu` y verificar si está funcionando como se espera.

```bash
qemu-system-x86_64  \
  -machine accel=kvm,type=q35 \
  -cpu host \
  -m 1G \
  -device virtio-net-pci,netdev=net0 \
  -netdev user,id=net0 \
  -drive if=virtio,format=raw,file="${GUEST_IMAGE_NAME}"
```

Una vez que la máquina virtual termine de arrancar el SO huésped, necesitas iniciar sesión con el usuario `root` y verificar si la red está funcionando utilizando el comando `apt update` (que descarga información de paquetes). Si hay problemas de red, podría ser necesario cambiar la configuración predeterminada de `-netdev`. A continuación, se muestra una lista de las que podrían ser modificadas (de `man qemu-system-x86_64`).

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

A continuación, se muestra un ejemplo de la opción `-netdev` con la configuración anterior y algunos valores modificados.

```bash
  -netdev user,id=net0,restrict=off,net=192.168.10.0/24,host=192.168.10.2,dns=192.168.10.3,dhcpstart=192.168.10.5,hostname=guestvm,dnssearch=8.8.8.8 \
```

Si la máquina virtual no está funcionando como se esperaba y necesitas hacer algunas actualizaciones, aquí hay un comando abreviado para cambiar la raíz nuevamente al sistema de archivos del SO huésped.

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


Herramientas de Software Recomendadas
-------------------------------------


### Servidor SSH

Para facilitar la conexión a la máquina virtual, podemos instalar un servidor SSH. Esto nos permitirá iniciar sesión en el SO huésped desde nuestra máquina anfitriona o cualquier otra computadora en la red, utilizando herramientas más convenientes que mejorarán la experiencia y, entre otras cosas, harán que *copiar y pegar* sea más fácil.

He elegido `dropbear`, un servidor SSH (y cliente) relativamente pequeño, que ocupa alrededor de 1800 kilobytes.

```bash
apt install --no-install-recommends \
    dropbear
```

Luego de la instalación del servidor SSH, es necesario actualizar la opción `-netdev` de **QEMU** para habilitar la conexión. Esto se logrará mediante la redirección de un puerto del anfitrión a uno del huésped. La configuración se realiza a través de la opción `hostfwd`.

```man
hostfwd=[tcp|udp]:[hostaddr]:hostport-[guestaddr]:guestport
    Redirect incoming TCP or UDP connections to the host port hostport to the guest IP address guestaddr on guest port guestport. If guestaddr is not specified,
    its value is x.x.x.15 (default first address given by the built-in DHCP server). By specifying hostaddr, the rule can be bound to a specific host interface.
    If no connection type is set, TCP is used. This option can be given multiple times.
```

Aquí hay un ejemplo de la opción `-netdev` con la configuración `hostfwd`. El puerto del anfitrión `2222` se reenviará al puerto del huésped `22` (el puerto predeterminado del servidor SSH).

```bash
  -netdev user,id=net0,hostfwd=tcp::2222-:22 \
```

A partir de este punto, podemos usar un cliente SSH para iniciar sesión en el SO huésped. Por lo tanto, otras opciones de **QEMU** que podrían ser útiles son `-display none` y `-nographic`.

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

A continuación se muestra el comando **QEMU** actualizado con la configuración anterior.

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

Ahora podemos acceder al SO huésped a través de una conexión SSH. Ten en cuenta que `localhost` debe ser reemplazado por la IP del anfitrión si la conexión se realiza desde otra computadora en la misma red. La opción `-p` define el puerto abierto en la máquina anfitriona (el que configuramos anteriormente), la opción `-v` agrega verbosidad, y las opciones `-o` se utilizan para no verificar las claves SSH del huésped (ya que vamos a confiar en nuestro SO huésped).

```bash
ssh -v -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p 2222 root@localhost
```


### Herramientas de software que recomiendo tener

Aquí hay una lista de herramientas que me gusta tener. La instalación de todas estas herramientas aumentará el tamaño del sistema en aproximadamente 9000 kilobytes.

* `procps`: Proporciona utilidades para **procfs** (un pseudo sistema de archivos con información sobre la tabla de procesos). Contiene los comandos `free`, `kill`, `pkill`, `pgrep`, `pmap`, `ps`, `pwdx`, `skill`, `slabtop`, `snice`, `sysctl`, `tload`, `top`, `uptime`, `vmstat`, `w` y `watch`.
* `less`: Una utilidad de paginación de archivos para mostrar texto una pantalla a la vez. Es una versión nueva y mejorada de `more`.
* `sudo`: Una herramienta para otorgar privilegios de root a usuarios normales.
* `tmux`: Un multiplexor de terminal que permite acceder y controlar múltiples terminales desde una sola.

```bash
apt install --no-install-recommends \
    less \
    procps \
    sudo \
    tmux
```

Con `sudo`, podemos dejar de usar el usuario **root** y crear un usuario normal (**admin**). Una vez creado el usuario, podemos otorgarle privilegios de root añadiendolo al grupo `sudo`. Luego, podemos actualizar el archivo de configuración de **sudo** para permitir que el usuario **admin** use el comando `sudo` sin necesidad de una contraseña.

```bash
adduser admin && \
adduser admin sudo && \
sed -i -e 's/^%sudo.*/%sudo ALL=(ALL) NOPASSWD: ALL/g' /etc/sudoers
```

Ahora podemos cerrar e iniciar sesión nuevamente con el nuevo usuario, **admin**, y podemos verificar que todo esté funcionando correctamente intentando obtener privilegios de root con el comando `sudo su`.


### Herramientas de red

Aquí hay una breve lista de herramientas de red que me gusta tener a mano:

* `curl`: Una herramienta de línea de comandos para transferir datos con sintaxis de URL.
* `inetutils-telnet`: Un cliente Telnet.
* `iputils-ping`: Es una herramienta que verifica la conexión y velocidad de respuesta entre dos dispositivos en una red.
* `netcat`: Una herramienta para leer y escribir en conexiones de red utilizando TCP o UDP.
* `lft`: [Traceroute de la cuarta capa](https://es.wikipedia.org/wiki/Layer_four_traceroute).

El siguiente comando instalará estas herramientas de red y aumentará el tamaño del sistema en aproximadamente 2900 kilobytes.

```bash
apt install --no-install-recommends \
    curl \
    inetutils-telnet \
    iputils-ping \
    netcat \
    lft
```

**¡IMPORTANTE!**: Cualquier programa que utilice el protocolo ICMP, como el comando `ping`, no funcionará con **QEMU** en el modo de red de usuario.

Aquí hay un ejemplo de cómo trazar la ruta para los protocolos ICMP y TCP con el comando `lft`.

```bash
lft -p google.com # ICMP
lft -b google.com # TCP
```


### Editor de texto

Debido a que uso `vim` a diario, el paquete `vim-tiny` es una opción con un buen costo/beneficio (aproximadamente 2200 kilobytes). Otra alternativa (muy) pequeña podría ser `levee`. Sin embargo, si el tamaño no es un problema, recomiendo `neovim`.

```bash
apt install --no-install-recommends \
    vim-tiny
```


### Herramientas de sistema que recomiendo tener

Con el siguiente comando, vamos a instalar los siguientes paquetes que mejorarán nuestra experiencia de usuario. Después de la instalación, el sistema crecerá aproximadamente 30 megabytes.

* `bash-completion`: Éste paquete extiende el comportamiento de autocompletado estándar de Bash para lograr líneas de comando complejas con solo unos pocos toques de tecla.
* `locales`: Archivos de datos para el soporte de localización (l10n) e internacionalización (i18n).
* `man-db`: Este paquete proporciona el comando `man`, la forma principal de examinar los archivos de ayuda del sistema (páginas del manual).

```bash
apt install --no-install-recommends \
    bash-completion \
    locales \
    man-db
```


### Configurar el teclado

Tengo un teclado en español, y las siguientes instrucciones son para configurarlo y establecer las locales del sistema. Estas instrucciones también pueden ser útiles si tenes un teclado de otro idioma. Sin embargo, si tenes un teclado en inglés, probablemente puedas ignorar esta sección y saltar a la siguiente. Esta configuración aumentará el tamaño del sistema en aproximadamente 13 megabytes.

Primero, instala los paquetes para configurar el [teclado](https://wiki.debian.org/Keyboard).

```bash
sudo apt install --no-install-recommends \
    keyboard-configuration \
    console-setup
```

El proceso de instalación iniciará el proceso de configuración del teclado. Seleccioné **22**, **84** y **6**.

```bash
> 22. Other
> 84. Spanish
>  6. Spanish - Spanish (Win keys)
```

A continuación, comenzará el proceso de configuración de la consola. Seleccioné **27** y **23**.

```bash
> 27. UTF-8
> 23. Guess optimal character set
```

Una vez que finalice la instalación de los paquetes, es necesario reconfigurar las locales del sistema, donde seleccioné **181** y **2**.

```bash
sudo dpkg-reconfigure locales
> 181. es_ES.UTF-8 UTF-8
>   2. C.UTF-8
```

Los últimos pasos son configurar la consola, actualizar la imagen de `initramfs` y reiniciar el sistema.

```bash
sudo setupcon
sudo update-initramfs -u
sudo reboot
```


Convertir Imagen de Disco
-------------------------

Una vez que estemos satisfechos con el estado del SO huésped, es hora de convertir la imagen de disco al formato `qcow2`. Este formato admite compresión, se ajusta al tamaño de su contenido y crece a medida que éste lo hace. Para hacer la conversión, ejecuta el siguiente comando.

```bash
GUEST_IMAGE_QCOW="$(basename "${GUEST_IMAGE_NAME}" | cut -d'.' -f1).qcow2" && \
qemu-img convert -c -p -f raw -O qcow2 "${GUEST_IMAGE_NAME}" "${GUEST_IMAGE_QCOW}"
```

En mi proceso, la nueva imagen de disco tiene un tamaño de aproximadamente 310 megabytes.

Ahora podemos ejecutar la máquina virtual utilizando la nueva imagen con el siguiente comando de **QEMU**.

```bash
qemu-system-x86_64  \
  -machine accel=kvm,type=q35 \
  -cpu host \
  -m 1G \
  -device virtio-net-pci,netdev=net0 \
  -netdev user,id=net0,hostfwd=tcp::2222-:22 \
  -drive if=virtio,format=qcow2,file="${GUEST_IMAGE_QCOW}"
```

También podemos convertirlo al formato utilizado por VirtualBox.

```bash
GUEST_IMAGE_VDI="$(basename "${GUEST_IMAGE_NAME}" | cut -d'.' -f1).vdi" && \
qemu-img convert -p -f raw -O vdi "${GUEST_IMAGE_NAME}" "${GUEST_IMAGE_VDI}"
```

Y también al formato utilizado por WSL (formato VHDX de Microsoft Hyper-V).

```bash
GUEST_IMAGE_VHDX="$(basename "${GUEST_IMAGE_NAME}" | cut -d'.' -f1).vhdx" && \
qemu-img convert -p -f raw -O vhdx "${GUEST_IMAGE_NAME}" "${GUEST_IMAGE_VHDX}"
```

Luego podrás importar el archivo `vhdx` con el siguiente comando ([@mira](https://superuser.com/a/1667985)).

```PowerShell
wsl --import-in-place [DISTRIBUTION_NAME] [FILE_NAME]
```
