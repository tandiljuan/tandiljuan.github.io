+++
title = "Debian Virtual: Guía Práctica Paso a Paso Desde Cero"
date = 2024-12-23T20:40:22-03:00
[taxonomies]
tags = ['QEMU', 'Virtualization', 'Debian']
series = ['Linux Playground From Scratch']
[extra]
add_toc = true
series = true
+++

Las máquinas virtuales (VMs) son una herramienta poderosa para ejecutar diferentes sistemas operativos en el mismo hardware. Esta guía te mostrará cómo configurar Debian, una distribución de Linux popular y liviana, como sistema operativo huésped dentro de una máquina virtual. Esta configuración es útil para probar software, aprender sobre diferentes sistemas operativos o crear un entorno de desarrollo consistente.

En los últimos años, he estado enseñando una introducción a GNU/Linux, Bash, Bash Script, los conceptos básicos de VIM y git. El principal problema que encontré durante el curso fue la falta de una plataforma común para que todos practicaran lo aprendido. No todos usan una distribución GNU/Linux o saben cómo instalarla. Entonces, se me ocurrió la idea de configurar una imagen de disco con un sistema operativo Debian preinstalado que pudiera cargarse en una máquina virtual (QEMU, VirtualBox o WSL). Esta guía contiene todos los pasos que seguí para crearla, y el sistema operativo anfitrión fue Ubuntu 16.04 (Xenial).

Bootstrap del SO Debian
-----------------------

Comencemos creando el directorio donde vamos a trabajar.

```bash
mkdir debian && cd debian
```

Luego, es necesario configurar algunas variables de entorno que se utilizarán a lo largo de esta guía. En estas variables, definiremos el tamaño (en gibibytes) de la imagen de disco (donde se instalará el SO huésped), el nombre de la imagen, la ruta de la imagen y el nombre de host del SO huésped.

```bash
DEBIAN_RELEASE="bullseye"
DEBIAN_ARCH="amd64"
GUEST_IMAGE_GB=5
GUEST_IMAGE_NAME="debian-${DEBIAN_RELEASE}-${DEBIAN_ARCH}.raw"
GUEST_MOUNT_PATH="./disk_mount"
GUEST_HOSTNAME='sandbox'
```

Una vez que tenemos las variables configuradas, necesitamos crear la imagen de disco.

```bash
dd if=/dev/zero of="${GUEST_IMAGE_NAME}" iflag=fullblock bs=1M count=$(( 1024 * $GUEST_IMAGE_GB )) && sync
```

Usando la herramienta `fdisk`, crea la tabla de particiones en la imagen de disco. Las opciones serán `n` para crear una nueva partición, `p` para hacerla primaria, `1` para establecerla como la primera partición, acepta los siguientes dos valores predeterminados, `a` para establecer el indicador de arranque y `w` para escribir los cambios y salir.

```bash
fdisk "${GUEST_IMAGE_NAME}"
# > n
# > p
# > 1
# > (default)
# > (default)
# > a
# > w
```

Monta la imagen usando un dispositivo de bucle y guarda la ruta del dispositivo en una variable de entorno.

```bash
GUEST_LOOP_DEV=$(sudo losetup --partscan --find --show "${GUEST_IMAGE_NAME}") && echo $GUEST_LOOP_DEV
# [ejemplo] > /dev/loop0
```

Crea un sistema de archivos `ext4` en la primera partición que se acaba de crear.

```bash
sudo mkfs.ext4 "${GUEST_LOOP_DEV}p1"
```

Crea un directorio para montar el sistema de archivos y luego móntalo.

```bash
mkdir "${GUEST_MOUNT_PATH}" && \
sudo mount "${GUEST_LOOP_DEV}p1" "${GUEST_MOUNT_PATH}"
```

Inicializa un sistema Debian básico (**bullseye**), incluyendo solo los paquetes esenciales (**minbase**) y estableciendo la arquitectura (**amd64**).

```bash
sudo debootstrap --arch="${DEBIAN_ARCH}" --variant=minbase "${DEBIAN_RELEASE}" "${GUEST_MOUNT_PATH}"
```

Después del comando anterior, el sistema debería tener un tamaño de aproximadamente 220 megabytes. Sin embargo, por el momento, el sistema está incompleto. No tiene el kernel, el gestor de arranque, el proceso de inicialización para arrancar el sistema ni el administrador de red.

Obtén el UUID de la partición, define la etiqueta de la partición y establécela.

```bash
GUEST_P1_UUID=$(lsblk -no UUID "${GUEST_LOOP_DEV}p1") && echo $GUEST_P1_UUID
GUEST_P1_LABEL="${GUEST_HOSTNAME}-root" && echo "${GUEST_P1_LABEL}"
sudo e2label "${GUEST_LOOP_DEV}p1" "${GUEST_P1_LABEL}"
```

Define el archivo de configuración `fstab` para el SO huésped.

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

Define el archivo de configuración `hosts` para el SO huésped.

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

Guarda las variables de entorno en un archivo para cargarlas y usarlas desde dentro del SO huésped.

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

Actualiza la lista de paquetes disponibles e instala solo los necesarios para tener un sistema que arranque.

```bash
apt update && \
apt install --no-install-recommends \
    grub-pc \
    init \
    linux-image-cloud-amd64 \
    network-manager
```

Actualiza el archivo de configuración de GRUB para que no tenga tiempos de espera e inicie el sistema inmediatamente.

```bash
sed -i -e 's/GRUB_TIMEOUT=.*/GRUB_TIMEOUT=0/g' /etc/default/grub && \
sed -i -e 's/GRUB_CMDLINE_LINUX_DEFAULT=.*/GRUB_CMDLINE_LINUX_DEFAULT=""/g' /etc/default/grub && \
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

Actualiza el archivo de configuración de arranque de GRUB y reemplaza el UUID de la partición con la etiqueta que establecimos anteriormente.

```bash
sed -i -e "s/UUID=${GUEST_P1_UUID}/LABEL=${GUEST_P1_LABEL}/g" /boot/grub/grub.cfg
```

Establece la contraseña para el usuario **root**.

```bash
passwd
```

Elimina los paquetes no utilizados (`autoremove`), borra los paquetes descargados en el repositorio local (`autoclean`) y limpia el directorio `/var/cache` (`clean`).

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

Después de seguir todas las instrucciones anteriores, el sistema debería tener un tamaño de aproximadamente 430 megabytes. A partir de este punto, los siguientes comandos utilizarán el emulador y virtualizador de máquinas [QEMU](https://www.qemu.org/), versión **2.5.0**.

```bash
qemu-system-x86_64 --version
# > QEMU emulator version 2.5.0 (Debian 1:2.5+dfsg-5ubuntu10.51+esm3), Copyright (c) 2003-2008 Fabrice Bellard
```

Ahora es el momento de arrancar el SO huésped usando una VM y verificar si está funcionando como se espera.

```bash
qemu-system-x86_64  \
  -machine accel=kvm,type=q35 \
  -cpu host \
  -m 1G \
  -device virtio-net-pci,netdev=net0 \
  -netdev user,id=net0 \
  -drive if=virtio,format=raw,file="${GUEST_IMAGE_NAME}"
```

Una vez que la VM termina de arrancar el SO huésped, debes iniciar sesión con el usuario `root` y verificar si la red está funcionando usando el comando `apt update` (que descarga información de los paquetes). Si hay problemas de red, podría ser necesario cambiar la configuración predeterminada de `-netdev`. A continuación, se muestra una lista de los que se podrían cambiar (de `man qemu-system-x86_64`).

```man
restrict=on|off
    Si esta opción está habilitada, el huésped estará aislado, es decir, no podrá contactar al anfitrión y ningún paquete IP del huésped se enrutará a través del anfitrión hacia el exterior. Esta opción no afecta a ninguna regla de reenvío establecida explícitamente.

net=addr[/mask]
    Establece la dirección de red IP que verá el huésped. Opcionalmente, especifica la máscara de red, ya sea en la forma a.b.c.d o como número de bits válidos de nivel superior. El valor predeterminado es 10.0.2.0/24.

host=addr
    Especifica la dirección visible del anfitrión para el huésped. El valor predeterminado es la segunda IP en la red del huésped, es decir, x.x.x.2.

dns=addr
    Especifica la dirección visible del nameserver virtual para el huésped. La dirección debe ser diferente de la dirección del anfitrión. El valor predeterminado es la tercera IP en la red del huésped, es decir, x.x.x.3.

dhcpstart=addr
    Especifica la primera de las 16 IP que puede asignar el servidor DHCP integrado. El valor predeterminado es la 15ª a la 31ª IP en la red del huésped, es decir, x.x.x.15 a x.x.x.31.

hostname=name
    Especifica el nombre de host del cliente informado por el servidor DHCP integrado.

dnssearch=domain
    Proporciona una entrada para la lista de búsqueda de dominio enviada por el servidor DHCP integrado. Se puede transmitir más de un sufijo de dominio especificando esta opción varias veces. Si es compatible, esto hará que el huésped intente automáticamente agregar los sufijos de dominio dados en caso de que no se pueda resolver un nombre de dominio.
```

A continuación, se muestra un ejemplo de la opción `-netdev` con la configuración anterior, con algunos valores modificados.

```bash
  -netdev user,id=net0,restrict=off,net=192.168.10.0/24,host=192.168.10.2,dns=192.168.10.3,dhcpstart=192.168.10.5,hostname=guestvm,dnssearch=8.8.8.8 \
```

Si la VM no funciona como se espera y necesitas hacer algunas actualizaciones, aquí hay un comando abreviado para cambiar la raíz nuevamente al sistema de archivos huésped.

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


Herramientas de software recomendadas
-------------------------------------


### Servidor SSH

Para facilitar la conexión a la VM huésped, podemos instalar un servidor SSH. Esto nos permitirá iniciar sesión en el SO huésped desde nuestra máquina anfitriona o cualquier otra computadora en la red, utilizando herramientas más convenientes que facilitarán el *copiar y pegar*.

Buscando un pequeño servidor SSH, mi primera opción fue instalar [TinySSH](https://tinyssh.org/), pero no admite la autenticación de usuario y contraseña (intencionalmente). Mi segunda opción fue instalar [Dropbear](https://matt.ucc.asn.au/dropbear/dropbear.html), pero tuve un problema con la distribución del teclado español. Entonces, terminé instalando el viejo y familiar [OpenSSH](https://www.openssh.com/), que pesa alrededor de 9700 kilobytes.

```bash
apt install --no-install-recommends openssh-server
```

Para iniciar sesión como usuario **root** y usar una contraseña (no solo autenticación de clave pública), necesitamos establecer un archivo de configuración mínimo con los siguientes valores.

```bash
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bkp && \
cat > /etc/ssh/sshd_config <<HEREDOC
Protocol 2
PermitRootLogin yes
PasswordAuthentication yes
PermitEmptyPasswords no
ChallengeResponseAuthentication no
UsePAM yes
HEREDOC
```

Después de la instalación del servidor SSH, es necesario actualizar la opción `-netdev` de **QEMU** para permitir la conexión. Esto se hará reenviando un puerto del anfitrión a un puerto en el huésped. La configuración se realiza a través de la configuración `hostfwd`.

```man
hostfwd=[tcp|udp]:[hostaddr]:hostport-[guestaddr]:guestport
    Redirige las conexiones TCP o UDP entrantes al puerto hostport del anfitrión a la dirección IP guestaddr del huésped en el puerto guestport del huésped. Si no se especifica guestaddr, su valor es x.x.x.15 (primera dirección predeterminada proporcionada por el servidor DHCP integrado). Al especificar hostaddr, la regla se puede vincular a una interfaz de anfitrión específica. Si no se establece ningún tipo de conexión, se utiliza TCP. Esta opción se puede dar varias veces.
```

Aquí hay un ejemplo de la opción `-netdev` con la configuración `hostfwd`. El puerto del anfitrión `2222` se reenviará al puerto del huésped `22` (el puerto predeterminado del servidor SSH).

```bash
  -netdev user,id=net0,hostfwd=tcp::2222-:22 \
```

A partir de este punto, podemos usar un cliente SSH para iniciar sesión en el SO huésped. Por lo tanto, otras opciones de **QEMU** que podrían ser útiles son `-display none` y `-nographic`.

```man
-display type
    Selecciona el tipo de pantalla que se utilizará. Esta opción es un reemplazo para las opciones de estilo antiguo -sdl/-curses/... Los valores válidos para el tipo son

    ...

    none
        No mostrar la salida de video. El huésped seguirá viendo una tarjeta gráfica emulada, pero su salida no se mostrará al usuario de QEMU. Esta opción difiere de la opción -nographic en que solo afecta lo que se hace con la salida de video; -nographic también cambia el destino de los datos del puerto serie y paralelo.

-nographic
    Normalmente, QEMU usa SDL para mostrar la salida VGA. Con esta opción, puedes deshabilitar totalmente la salida gráfica para que QEMU sea una simple aplicación de línea de comandos. El puerto serie emulado se redirige a la consola y se multiplexa con el monitor (a menos que se redirija explícitamente a otro lugar). Por lo tanto, todavía puedes usar QEMU para depurar un kernel de Linux con una consola serie. Usa C-a h para obtener ayuda sobre cómo cambiar entre la consola y el monitor.
```

Apaguemos la VM y reiniciémosla con la configuración que nos permite conectarnos usando SSH.

```bash
poweroff
```

A continuación, se muestra el comando **QEMU** actualizado con la configuración anterior.

```bash
qemu-system-x86_64  \
  -machine accel=kvm,type=q35 \
  -cpu host \
  -m 1G \
  -device virtio-net-pci,netdev=net0 \
  -netdev user,id=net0,hostfwd=tcp::2222-:22 \
  -drive if=virtio,format=raw,file="${GUEST_IMAGE_NAME}" \
  -nographic \
  -display none
```

Ahora podemos acceder al SO huésped a través de una conexión SSH. Ten en cuenta que `localhost` debe reemplazarse con la IP del anfitrión si la conexión se realiza desde otra computadora en la misma red. La opción `-p` define el puerto abierto en la máquina anfitriona (que establecimos anteriormente), la opción `-v` agrega verbosidad y las opciones `-o` se utilizan para no verificar las claves SSH del huésped (ya que vamos a confiar en nuestro SO huésped).

```bash
ssh -v -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p 2222 root@localhost
```


### Herramientas de software que estaría bueno tener {#nice-to-have-software-tools}

Aquí hay una lista de herramientas que me gusta tener. La instalación de todas estas herramientas aumentará el tamaño del sistema en aproximadamente 5000 kilobytes.

* `procps`: Proporciona utilidades para **procfs** (un pseudo sistema de archivos con información sobre la tabla de procesos). Contiene `free`, `kill`, `pkill`, `pgrep`, `pmap`, `ps`, `pwdx`, `skill`, `slabtop`, `snice`, `sysctl`, `tload`, `top`, `uptime`, `vmstat`, `w` y `watch`.
* `psmisc`: Paquete con utilidades misceláneas que usan el proc FS: `fuser`, `killall`, `peekfd`, `pstree` y `prtstat`.
* `less`: Una utilidad de paginación de archivos para mostrar texto una pantalla a la vez. Es la versión moderna y mejorada de `more`.
* `sudo`: Una herramienta para otorgar privilegios de root limitados a usuarios normales.

```bash
apt install --no-install-recommends \
    less \
    procps \
    psmisc \
    sudo
```

Con `sudo`, podemos dejar de usar el usuario **root** y crear un usuario normal (**admin**). Una vez que se crea, podemos otorgarle privilegios de root agregando el usuario `admin` al grupo `sudo`. Luego, podemos actualizar el archivo de configuración de **sudo** para permitir que el usuario `admin` use el comando `sudo` sin una contraseña.

```bash
adduser admin && \
adduser admin sudo && \
sed -i -e 's/^%sudo.*/%sudo ALL=(ALL) NOPASSWD: ALL/g' /etc/sudoers
```

Ahora podemos cerrar sesión y volver a iniciar sesión con el nuevo usuario, y podemos verificar que todo esté funcionando bien intentando obtener privilegios de root con el comando `sudo su`.


### Herramientas de red

Aquí hay una breve lista de herramientas de red que me gusta tener a mano:

* `curl`: Una herramienta de línea de comandos para transferir datos con sintaxis de URL.
* `inetutils-telnet`: Un cliente Telnet.
* `iproute2`: Colección de utilidades para redes y control de tráfico.
* `iputils-ping`: Una herramienta para probar la accesibilidad de los hosts de red.
* `netcat`: Una herramienta para leer y escribir en conexiones de red usando TCP o UDP.
* `lft`: [Layer four traceroute](https://en.wikipedia.org/wiki/Layer_four_traceroute).

El siguiente comando instalará estas herramientas de red y aumentará el tamaño del sistema en aproximadamente 7000 kilobytes.

```bash
apt install --no-install-recommends \
    curl \
    inetutils-telnet \
    iproute2 \
    iputils-ping \
    netcat \
    lft
```

**¡IMPORTANTE!**: Cualquier protocolo ICMP, como el que usa el comando `ping`, no funcionará con **QEMU** en el modo de red de usuario.

Aquí hay un ejemplo de cómo rastrear la ruta para los protocolos ICMP y TCP con el comando `lft`.

```bash
lft -p google.com # ICMP
lft -b google.com # TCP
```


### Herramientas de sistema que estaría bueno tener

Con el siguiente comando, vamos a instalar los siguientes paquetes que mejorarán nuestra experiencia de usuario. Después de la instalación, el sistema crecerá en aproximadamente 30 megabytes.

* `bash-completion`: Extiende el relleno automático de Bash para lograr líneas de comando complejas con solo unas pocas pulsaciones de teclas.
* `locales`: Archivos de datos legibles por máquina, objetos compartidos y programas utilizados por la biblioteca C para la localización (l10n) y el soporte de internacionalización (i18n).
* `man-db`: Este paquete proporciona el comando `man`, la forma principal de examinar los archivos de ayuda del sistema (páginas de manual).

```bash
apt install --no-install-recommends \
    bash-completion \
    locales \
    man-db
```


### Configuración del teclado

Tengo un teclado español, y las siguientes instrucciones son para configurarlo y definir las configuraciones regionales del sistema. Estas instrucciones también pueden ser útiles si tienes un teclado para un idioma diferente. Sin embargo, si tienes un teclado inglés, es probable que puedas ignorar esta sección y pasar a la siguiente. Esta configuración aumentará el tamaño del sistema en aproximadamente 13 megabytes.

Primero, instala los paquetes para configurar el [teclado](https://wiki.debian.org/Keyboard).

```bash
apt install --no-install-recommends \
    keyboard-configuration \
    console-setup
```

El proceso de instalación iniciará el proceso de configuración del teclado. Seleccioné **22** ('Otro'), **84** ('Español') y **6** ('Español - Español (Win keys)') para la [distribución española](https://kbdlayout.info/kbdsp).

```bash
# > Distribución del teclado: 22
# > País de origen del teclado: 84
# > Distribución del teclado: 6
```

Luego, iniciará el proceso de configuración de la consola. Seleccioné **27** ('UTF-8') y **14** ('Latin1 y Latin5 - Europa occidental e idiomas turcos').

```bash
# > Codificación para usar en la consola: 27
# > Juego de caracteres para soportar: 14
```

Una vez que finaliza la instalación del paquete, es necesario reconfigurar las configuraciones regionales del sistema, donde seleccioné **181** ('es_ES.UTF-8 UTF-8'), **156** ('en_US ISO-8859-1') y **2** ('C.UTF-8').

```bash
dpkg-reconfigure locales
# > Configuraciones regionales para generar: 181 156
# > Configuración regional predeterminada para el entorno del sistema: 2
```

Una vez que se han definido las configuraciones regionales, podemos establecerlas para el usuario `admin` a través de variables de entorno en el archivo `.profile`.

```bash
cat <<HEREDOC >> /home/admin/.profile

LANG="es_ES.UTF-8"
LANGUAGE="es_ES.UTF-8"
LC_CTYPE="es_ES.UTF-8"
LC_NUMERIC="es_ES.UTF-8"
LC_TIME="es_ES.UTF-8"
LC_COLLATE="es_ES.UTF-8"
LC_MONETARY="es_ES.UTF-8"
LC_MESSAGES="es_ES.UTF-8"
LC_PAPER="es_ES.UTF-8"
LC_NAME="es_ES.UTF-8"
LC_ADDRESS="es_ES.UTF-8"
LC_TELEPHONE="es_ES.UTF-8"
LC_MEASUREMENT="es_ES.UTF-8"
LC_IDENTIFICATION="es_ES.UTF-8"
LC_ALL="es_ES.UTF-8"
HEREDOC
```

Los últimos pasos son para liberar espacio, borrar el historial de bash y apagar la VM.

```bash
apt-get autoremove && \
apt-get autoclean && \
apt-get clean && \
rm ~/.bash_history && \
history -cw && \
poweroff
```


Convertir imagen de disco
-------------------------

Una vez que estemos satisfechos con el estado del SO huésped, es hora de convertir la imagen RAW al formato `qcow2`. Este formato admite compresión, tendrá el tamaño de su contenido y crecerá a medida que crezca el contenido. Para hacer esto, ejecuta el siguiente comando.

```bash
GUEST_IMAGE_QCOW="$(basename "${GUEST_IMAGE_NAME}" | cut -d'.' -f1).qcow2" && \
qemu-img convert -c -p -f raw -O qcow2 "${GUEST_IMAGE_NAME}" "${GUEST_IMAGE_QCOW}"
```

En mi proceso, la nueva imagen de disco tiene un tamaño de aproximadamente 310 megabytes.

Ahora podemos ejecutar la VM usando la nueva imagen con el siguiente comando **QEMU**.

```bash
qemu-system-x86_64  \
  -machine accel=kvm,type=q35 \
  -cpu host \
  -m 1G \
  -device virtio-net-pci,netdev=net0 \
  -netdev user,id=net0,hostfwd=tcp::2222-:22 \
  -drive if=virtio,format=qcow2,file="${GUEST_IMAGE_QCOW}" \
  -nographic \
  -display none
```

También podemos convertirlo al formato utilizado por VirtualBox.

```bash
GUEST_IMAGE_VDI="$(basename "${GUEST_IMAGE_NAME}" | cut -d'.' -f1).vdi" && \
qemu-img convert -p -f raw -O vdi "${GUEST_IMAGE_NAME}" "${GUEST_IMAGE_VDI}"
```

Así como al formato utilizado por WSL (formato Microsoft Hyper-V VHDX).

```bash
GUEST_IMAGE_VHDX="$(basename "${GUEST_IMAGE_NAME}" | cut -d'.' -f1).vhdx" && \
qemu-img convert -p -f raw -O vhdx "${GUEST_IMAGE_NAME}" "${GUEST_IMAGE_VHDX}"
```

Luego, puedes importar el archivo `vhdx` con este comando ([@see](https://superuser.com/a/1667985)).

```PowerShell
wsl --import-in-place [DISTRIBUTION_NAME] [FILE_NAME]
```


Finalizando
-----------

En esta publicación, hemos revisado el proceso para tener Debian listo para ser ejecutado como un SO huésped desde cero. Por supuesto, hay algunas secciones que se han documentado para satisfacer mis necesidades, pero te resultará fácil adaptarlas a tus necesidades. Espero que encuentres útil esta publicación.

¡Saludos y hasta la próxima!
