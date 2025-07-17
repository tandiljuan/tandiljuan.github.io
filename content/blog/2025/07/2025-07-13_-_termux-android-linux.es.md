+++
title = "Termux: Tu Linux de Bolsillo en Android"
date = 2025-07-13T19:03:32-03:00
[taxonomies]
tags = ['Termux', 'Android', 'QEMU', 'Docker']
[extra]
add_toc = true
+++

En publicaciones anteriores, expliqué cómo configurar un sistema operativo para que se ejecute dentro de una máquina virtual. Sin embargo, es posible que no puedas ejecutar una VM por falta de permisos de administrador, por no tener suficientes recursos de hardware, porque prefieras evitar la molestia o por cualquier otro motivo. Si esta es tu situación y tenés un dispositivo [Android](https://en.wikipedia.org/wiki/Android_%28operating_system%29), en esta publicación te explicaré que hacer para usarlo como una solución alternativa.

Hasta que el [Framework de Virtualización de Android](https://source.android.com/docs/core/virtualization) esté disponible globalmente para [ejecutar un sistema operativo Linux en una máquina virtual](https://www.youtube.com/watch?v=F2JSlMfgCeg), [Termux](https://termux.dev/en/) es la mejor opción para ejecutar un emulador de terminal en Android. Tené en cuenta que no emula ni virtualiza nada. Termux establece un pequeño sistema base que nos permite realizar una amplia variedad de tareas desde la interfaz de línea de comandos (CLI). Sin embargo, estaremos limitados por las restricciones del entorno de Android. Por ejemplo, en un dispositivo nuevo, no tendrás permisos de **root** a menos que el dispositivo haya sido rooteado. Para obtener más información, consultá la página ["Getting Started"](https://wiki.termux.com/wiki/Getting_started) de Termux.

Como referencia, al momento de escribir este artículo, estoy usando la versión **0.118.3** de Termux y Android **15**.


Instalar F-Droid
----------------

Hay diferentes maneras de instalar Termux. Acá, veremos cómo instalarlo desde [F-Droid](https://en.wikipedia.org/wiki/F-Droid), una tienda de aplicaciones y un repositorio de software de código abierto y gratuito para Android. Si bien no es estrictamente obligatorio, usaremos la aplicación F-Droid para instalar Termux y administrar futuras actualizaciones. A continuación, se muestra una breve lista de pasos para instalar F-Droid, pero podés consultar la [documentación oficial](https://f-droid.org/en/docs/Get_F-Droid/#option-2-download-and-install-f-droid-apk) para obtener instrucciones detalladas. Empezá por ir a la [página de inicio](https://f-droid.org/) de F-Droid y descargar el archivo `F-Droid.apk`.

{{ internal_link(name="F-Droid: Sitio web", path="assets/20250713-termux-android-linux/fdroid_001.png") }}

Luego, instala la aplicación desde el archivo descargado.

{{ internal_link(name="F-Droid: Diálogo de instalación", path="assets/20250713-termux-android-linux/fdroid_002.png") }}
{{ internal_link(name="F-Droid: Instalando aplicación", path="assets/20250713-termux-android-linux/fdroid_003.png") }}

Una vez que se complete la instalación, abrí la aplicación haciendo clic en el nuevo icono y revisá las aplicaciones disponibles en el repositorio.

{{ internal_link(name="F-Droid: Icono de la aplicación", path="assets/20250713-termux-android-linux/fdroid_004.jpg") }}
{{ internal_link(name="F-Droid: Pantalla principal de la aplicación", path="assets/20250713-termux-android-linux/fdroid_005.png") }}


Instalar Termux
---------------

Dentro de la aplicación F-Droid, hacé clic en el icono de búsqueda (la lupa).

{{ internal_link(name="F-Droid: Botón de búsqueda", path="assets/20250713-termux-android-linux/termux_install_001.png") }}

Una vez que estés en la pantalla de búsqueda, ingresá "**termux**" en el campo de texto. Verás una lista de resultados; hacé clic en el botón de descarga de la aplicación Termux (emulador de terminal con paquetes).

{{ internal_link(name="F-Droid: Botón de descarga de Termux", path="assets/20250713-termux-android-linux/termux_install_002.png") }}
{{ internal_link(name="F-Droid: Descargando Termux", path="assets/20250713-termux-android-linux/termux_install_003.png") }}

Una vez finalizada la descarga, F-Droid intentará instalar automáticamente la aplicación. Si todavía no lo hiciste, cuando Android te lo solicite, permití la instalación de aplicaciones de fuentes desconocidas y luego presioná el botón **instalar**.

{{ internal_link(name="F-Droid: Conceder permiso para instalar aplicaciones", path="assets/20250713-termux-android-linux/termux_install_004.png") }}
{{ internal_link(name="F-Droid: Botón de instalación de Termux", path="assets/20250713-termux-android-linux/termux_install_005.png") }}
{{ internal_link(name="Termux: Diálogo de instalación", path="assets/20250713-termux-android-linux/termux_install_006.png") }}

Es posible que Google Play Protect te impida instalar Termux. Esto se debe a que Termux está diseñado para una versión anterior de Android (targetSdk 28), lo que le permite ejecutar archivos arbitrarios. Las versiones más recientes de Android imponen restricciones que afectan la funcionalidad de Termux como entorno Linux. Podés leer más sobre esto [acá](https://github.com/termux/termux-app/issues/3653). Confiemos en la aplicación e ignorá la advertencia presionando el botón "**instalar de todos modos**".

{{ internal_link(name="Termux: Instalar (de todos modos) aplicación no segura", path="assets/20250713-termux-android-linux/termux_install_007.png") }}

Después de la instalación, hacé clic en el icono y abrí Termux.

{{ internal_link(name="Termux: Icono de la aplicación", path="assets/20250713-termux-android-linux/termux_install_008.jpg") }}
{{ internal_link(name="Termux: Pantalla principal del terminal", path="assets/20250713-termux-android-linux/termux_install_009.png") }}

Dentro de Termux y como primera medida, sugiero ejecutar los comandos que se describen a continuación. El primero actualizará las aplicaciones y sus dependencias.

```bash
pkg upgrade
```

El segundo comando creará enlaces para [acceder al almacenamiento compartido](https://wiki.termux.com/wiki/Termux-setup-storage).

```bash
termux-setup-storage
```

Vale la pena mencionar los comandos para activar un [wakelock](https://wiki.termux.com/wiki/Termux-wake-lock): `termux-wake-lock` y `termux-wake-unlock`. Estos comandos adquieren (o liberan) el wakelock de Termux para evitar que la CPU entre en reposo. Esto es útil cuando querés que una aplicación se ejecute en segundo plano sin ser interrumpida por la pantalla de bloqueo de Android.

Es posible que desees ocultar el teclado virtual o la barra de herramientas. Para hacer esto, deslizá el dedo desde el lado izquierdo de la pantalla para abrir el panel de navegación. Luego, presioná el botón "**keyboard**" para alternar la visibilidad del teclado virtual, o mantené presionado para alternar la visibilidad de la barra de herramientas del terminal. Para obtener más información, consultá la documentación de la [interfaz de usuario](https://wiki.termux.com/wiki/User_Interface).

{{ internal_link(name="Termux: Deslizar desde el lado izquierdo para el menú de navegación", path="assets/20250713-termux-android-linux/termux_install_010.png") }}


Apariencia de Termux
--------------------

A continuación, explicaré dos formas de cambiar la apariencia de Termux: a través de la fuente y los colores. Cambiar el tamaño de la fuente es tan simple como hacer "pinch-to-zoom" (pellizcar para hacer zoom) en la pantalla.


### Plugin

La primera forma es a través del plugin oficial [Termux:Styling](https://wiki.termux.com/wiki/Termux:Styling). Instalalo de la misma manera que instalaste Termux. Después de instalar el plugin, mantené presionado en la pantalla y seleccioná el botón "**More...**" (más), que abrirá un menú más extenso donde seleccionarás la opción "**Style**" (estilo). Luego, verás dos botones que te permiten cambiar los colores y/o la fuente.

{{ internal_link(name="Termux: Opciones del menú de pulsación larga", path="assets/20250713-termux-android-linux/termux_styling_001.png") }}
{{ internal_link(name="Termux: Opción 'Estilo' en el menú 'Más'", path="assets/20250713-termux-android-linux/termux_styling_002.png") }}
{{ internal_link(name="Termux: Botones para cambiar color y fuente", path="assets/20250713-termux-android-linux/termux_styling_003.png") }}

Por ejemplo, podés probar el esquema de colores `Argonaut` y la fuente `Jetbrains Mono`.


### Manualmente

Podés cambiar los colores actualizando el archivo `colors.properties` y después ejecutando el comando `termux-reload-settings`. A continuación, se muestra un ejemplo con el comando para configurar el tema oscuro **mocha** del proyecto [catppuccin](https://catppuccin.com/).

```bash
cat > $HOME/.termux/colors.properties <<HEREDOC && termux-reload-settings
# Catppuccin Mocha theme for Termux
# Based on the official Catppuccin palette (https://github.com/catppuccin/palette).
# With assistance from Google Gemini.

# --------------------------------------
# Primary colors
# --------------

background=#1E1E2E
foreground=#CDD6F4

# --------------------------------------
# Black (ANSI 0-7)
# ----------------

# Surface1
color0=#45475A
# Red
color1=#F38BA8
# Green
color2=#A6E3A1
# Yellow
color3=#F9E2AF
# Blue
color4=#89B4FA
# Pink
color5=#F5C2E7
# Teal
color6=#94E2D5
# Subtext1
color7=#BAC2DE

# --------------------------------------
# Bright colors (ANSI 8-15)
# -------------------------

# Surface2
color8=#585B70
# Bright Red (same as Red)
color9=#F38BA8
# Bright Green (same as Green)
color10=#A6E3A1
# Bright Yellow (same as Yellow)
color11=#F9E2AF
# Bright Blue (same as Blue)
color12=#89B4FA
# Bright Pink (same as Pink)
color13=#F5C2E7
# Bright Teal (same as Teal)
color14=#94E2D5
# Subtext0
color15=#A6ADC8
HEREDOC
```

Si preferís colores claros, a continuación se muestra el comando para configurar el tema **latte**.

```bash
cat > $HOME/.termux/colors.properties <<HEREDOC && termux-reload-settings
# Catppuccin Latte theme for Termux
# Based on the official Catppuccin palette (https://github.com/catppuccin/palette).
# With assistance from Google Gemini.

# --------------------------------------
# Primary colors
# --------------

background=#EFF1F5
foreground=#4C4F69

# --------------------------------------
# Black (ANSI 0-7)
# ----------------

# Surface1
color0=#BCC0CC
# Red
color1=#D20F39
# Green
color2=#40A02B
# Yellow
color3=#DF8E1D
# Blue
color4=#1E66F5
# Pink
color5=#EA76CB
# Teal
color6=#179299
# Subtext1
color7=#5C5F77

# --------------------------------------
# Bright colors (ANSI 8-15)
# -------------------------

# Surface2
color8=#ACAFBE
# Bright Red (same as Red)
color9=#D20F39
# Bright Green (same as Green)
color10=#40A02B
# Bright Yellow (same as Yellow)
color11=#DF8E1D
# Bright Blue (same as Blue)
color12=#1E66F5
# Bright Pink (same as Pink)
color13=#EA76CB
# Bright Teal (same as Teal)
color14=#179299
# Subtext0
color15=#6C6F85
HEREDOC
```

Una vez que hayas configurado los colores, podés proceder a configurar una fuente. A continuación, se muestra un ejemplo de los comandos que debés ejecutar para instalar la fuente **JetBrains** de [Nerd Fonts](https://www.nerdfonts.com/), un proyecto que parchea fuentes con una gran cantidad de glifos (iconos).

Comencemos por descargar el paquete con las fuentes JetBrains.

```bash
curl -LO 'https://github.com/ryanoasis/nerd-fonts/releases/download/v3.4.0/JetBrainsMono.zip'
```

Luego, eliminá la fuente que estás usando actualmente. Esto es importante porque, de lo contrario, la aplicación fallará (consultá el [issue 3473](https://github.com/termux/termux-app/issues/3473)).

```bash
rm -f $HOME/.termux/font.ttf
```

Ahora podés configurar la versión de fuente que más te guste. El siguiente comando configurará la fuente mono regular con [ligaduras](https://en.wikipedia.org/wiki/Ligature_%28writing%29).

```bash
unzip -p JetBrainsMono.zip JetBrainsMonoNerdFontMono-Regular.ttf > $HOME/.termux/font.ttf
```

Si no te gustan las ligaduras, usá el siguiente comando para configurar la fuente sin ellas.

```bash
unzip -p JetBrainsMono.zip JetBrainsMonoNLNerdFontMono-Regular.ttf > $HOME/.termux/font.ttf
```

Después de instalar la fuente, ejecutá el siguiente comando para recargar la configuración.

```bash
termux-reload-settings
```

Una vez que estés satisfecho con los resultados, eliminá el paquete con las fuentes para liberar espacio.

```bash
rm JetBrainsMono.zip
```


Secure Shell (SSH)
------------------

Si instalaste Termux en un dispositivo móvil y encontrás que la pantalla es incómoda de leer debido a su pequeño tamaño, o si no tenés un teclado físico y escribir con el teclado virtual no es agradable, podés usar una computadora para [acceder remotamente a Termux a través de una conexión SSH](https://wiki.termux.com/wiki/Remote_Access#SSH). Para hacer esto, seguiremos una serie de pasos, desde la instalación de SSH hasta la configuración de la autenticación de clave pública. SSH también se utilizará en la siguiente sección para acceder a una máquina emulada.


### Instalación

Comencemos ejecutando el siguiente comando para instalar [OpenSSH](https://en.wikipedia.org/wiki/OpenSSH).

```bash
pkg install openssh
```

Luego, ajustaremos el archivo de configuración. Pero primero, con el siguiente comando, hagamos una copia de seguridad del archivo de configuración predeterminado.

```bash
mv $PREFIX/etc/ssh/sshd_config $PREFIX/etc/ssh/sshd_config.bkp
```

Ahora, definamos el archivo de configuración para OpenSSH con el siguiente comando. Esta es una configuración simple que habilita el inicio de sesión con contraseña y clave solo para el usuario actual (aunque definir el usuario no es estrictamente necesario) y habilita el [Protocolo Seguro de Transferencia de Archivos](https://en.wikipedia.org/wiki/SSH_File_Transfer_Protocol).

```bash
cat > $PREFIX/etc/ssh/sshd_config <<HEREDOC
###############################
# SSHD configuration for Termux
###############################

# Allow client to pass locale environment variables
AcceptEnv LANG LC_*

# Block root user login
DenyUsers root
DenyGroups root
PermitRootLogin no

# Allow just Termux user
AllowUsers $(whoami)

# Disabled host based authentication
HostbasedAuthentication no
# Don't read the user's ~/.rhosts and ~/.shosts files
IgnoreRhosts yes
# Server disconnects if the user has not successfully logged in (seconds)
LoginGraceTime 120
# Check file modes and ownership of the user's files and home directory before
# accepting login.
StrictModes yes

# Password based logins are disabled
# Only public key based logins are allowed
#AuthenticationMethods publickey

# Enable public key authentication and set keys file
PubkeyAuthentication yes
AuthorizedKeysFile %h/.ssh/authorized_keys

# Change to no to disable tunnelled clear text passwords
PasswordAuthentication yes
# To enable empty passwords, change to yes (NOT RECOMMENDED)
PermitEmptyPasswords yes
# Change to yes to enable challenge-response passwords
# (beware issues with some PAM modules and threads)
ChallengeResponseAuthentication no

# Extra security options
AllowTcpForwarding no
TCPKeepAlive yes
X11Forwarding no
X11DisplayOffset 10
PrintMotd no

# Configure external sybsystem
# @see http://serverfault.com/a/660325
Subsystem sftp $PREFIX/libexec/sftp-server
HEREDOC
```

Ahora podes iniciar un servidor SSH para acceder a Termux desde una computadora externa. A continuación, se muestra como crear un pequeño script para iniciar el servidor SSH. Este script primero ejecutará `termux-wake-lock` para mantener la CPU activa, luego imprimirá algunos valores para poder configurar el cliente SSH en la otra máquina y, por último, iniciará y mantendrá el servidor SSH a la vista sin convertirse en un demonio (vas a ver los registros en pantalla). El script es solo un "wrapper" para automatizar algunos pasos; podes actualizarlo a tu gusto o simplemente iniciar el demonio con el comando `sshd` y detenerlo con el comando `pkill sshd`.

```bash
cat > $PREFIX/bin/sshd-custom <<HEREDOC && chmod u+x $PREFIX/bin/sshd-custom
#!$PREFIX/bin/bash

# Prevent the CPU from sleeping
termux-wake-lock

TERMUX_SSHD_IP=\$(ifconfig 2>/dev/null | grep inet | grep -v 127.0.0.1 | grep -o -E 'inet [0-9\.]+' | cut -d' ' -f2 | tail -n1 | xargs)
TERMUX_SSHD_USER=\$(whoami)
TERMUX_SSHD_PORT=\${1:-8022}

echo "=========================="
echo "  List of sshd Variables  "
echo "=========================="
echo
printf "* %4s: %-20s\n" "USER" "\${TERMUX_SSHD_USER}"
printf "* %4s: %-20s\n" "IP" "\${TERMUX_SSHD_IP}"
printf "* %4s: %-20s\n" "PORT" "\${TERMUX_SSHD_PORT}"
echo

# Start ssh daemon
sshd -D -e -p \$TERMUX_SSHD_PORT
HEREDOC
```

Ejecuta el script con el comando `sshd-custom` y verás una salida como el siguiente ejemplo.

```
==========================
  List of sshd Variables
==========================

* USER: u0_a662
*   IP: 192.168.0.244
* PORT: 8022

Server listening on :: port 8022.
Server listening on 0.0.0.0 port 8022.
```

Luego usá estos valores en la computadora donde ejecutarás el cliente SSH. De ahora en adelante, para reducir la confusión, voy a usar las siguientes variables que representan al USUARIO, la IP y el PUERTO. Sentite libre de usar estas variables (actualizando los valores) y reutilizar los comandos tal como están escritos en los siguientes ejemplos; si preferís no usar las variables, vas a tener que adaptar los comandos con sus respectivos valores.

```bash
TERMUX_USER="u0_a662"
TERMUX_IP="192.168.0.244"
TERMUX_PORT="8022"
```

El script `sshd-custom` acepta un parámetro con el puerto que te gustaría usar para el servidor SSH (**8022** por defecto). Por ejemplo, si querés usar el puerto 2222, llame al script así: `sshd-custom 2222`.


### Autenticación con Contraseña

Una forma de autenticarse y acceder a Termux a través del protocolo SSH es mediante el uso de una contraseña. Esto también será necesario si se quiere utilizar la autenticación de clave pública (descripta en la siguiente sección). Primero, definí una contraseña en Termux usando el siguiente comando.

```bash
passwd
```

Ahora podes acceder a Termux, a través del protocolo SSH, desde tu computadora usando el siguiente comando del cliente SSH. Si estás utilizando un cliente diferente, como [PuTTY](https://en.wikipedia.org/wiki/PuTTY), consulta la [documentación](https://www.chiark.greenend.org.uk/~sgtatham/putty/docs.html) para conocer como establecer la conexión.

```bash
ssh -p $TERMUX_PORT "${TERMUX_USER}@${TERMUX_IP}"
```


### Autenticación con Clave Pública

Una alternativa a la autenticación con contraseña es usar [criptografía de clave pública](https://en.wikipedia.org/wiki/Public-key_cryptography). Primero, generá el par de claves pública y privada en la máquina cliente (por ejemplo: tu computadora). El siguiente comando va a crear las claves usando el algoritmo [Ed25519](https://en.wikipedia.org/wiki/EdDSA). El uso del algoritmo [RSA](https://en.wikipedia.org/wiki/RSA_cryptosystem) está [desaconsejado](https://blog.trailofbits.com/2019/07/08/fuck-rsa/) y fue declarado *deprecated* (obsoleto) desde [OpenSSH 8.2](https://www.openssh.com/txt/release-8.2).

```bash
ssh-keygen -t ed25519 -C "ssh@termux" -f ~/.ssh/for_termux
```

Después, subí la clave *pública* desde la máquina cliente (tu computadora) al servidor SSH (tu dispositivo Android) usando el siguiente comando.

```bash
ssh-copy-id \
  -i ~/.ssh/for_termux \
  -p $TERMUX_PORT "${TERMUX_USER}@${TERMUX_IP}"
```

Una vez que la clave se haya subido al servidor, vas a poder acceder a Termux usando la autenticación con clave pública. El siguiente comando lo va a hacer, y la principal diferencia con el comando de **autenticación con contraseña** es el parámetro `-i ~/.ssh/for_termux` que selecciona la clave privada para la autenticación.

```bash
ssh \
  -i ~/.ssh/for_termux \
  -p $TERMUX_PORT "${TERMUX_USER}@${TERMUX_IP}"
```

Una vez que te hayas conectado exitosamente a Termux a través de SSH usando el comando anterior, podés actualizar el archivo de configuración del servidor SSH para deshabilitar la autenticación con contraseña y habilitar *únicamente* la autenticación con clave pública. Con el siguiente comando vamos a realizar ésta actualización, pero solo va a funcionar si el archivo de configuración es el que creamos previamente.

```bash
ed $PREFIX/etc/ssh/sshd_config <<HEREDOC
28s/^#//
35s/yes$/no/
wq
HEREDOC
```

Ahora podés deshabilitar la contraseña del usuario, y por lo tanto la autenticación con contraseña, ejecutando el siguiente comando.

```bash
passwd -d
```

Para que los cambios tengan efecto, reiniciá el servidor SSH. Detenelo con `pkill sshd` y luego volvé a ejecutar el comando.


Emulación de Computadoras
-------------------------

Con Termux vas a podés hacer un montón de cosas, pero, como mencioné al principio de esta publicación, vas a estar limitado por el dispositivo Android. Una de estas limitaciones es que no vas a poder ejecutar [contenedores](https://en.wikipedia.org/wiki/Containerization_%28computing%29).

Una solución para estas limitaciones es emular una máquina que ejecute un sistema operativo sin restricciones. Para la emulación, vamos a usar [QEMU](https://en.wikipedia.org/wiki/QEMU) e instalar el sistema operativo [Alpine Linux](https://en.wikipedia.org/wiki/Alpine_Linux) en la computadora emulada, ya que está diseñado para ser pequeño y simple.

He estado usando la palabra "**emulación**" porque actualmente no disponemos de las tecnologías para [virtualizar](https://en.wikipedia.org/wiki/Virtualization) una máquina. QEMU emulará una arquitectura seleccionada, lo que tiene un costo de rendimiento porque necesita traducir las instrucciones de la arquitectura emulada a la arquitectura del host. Vamos a elegir la arquitectura [x86](https://en.wikipedia.org/wiki/X86) porque funciona relativamente bien y podemos reutilizar las instrucciones que ya conocemos para instalar Alpine Linux.

Para ver si tu dispositivo puede emular una máquina decentemente, he ejecutado una serie de [benchmarks](#benchmarks) que podés usar como referencia. Podés ejecutar los benchmarks en la sección "[dispositivo](#device)" para saber si vale la pena continuar con el proceso de emulación comparando tus números con los míos. Para resumir los resultados de mis benchmarks, el rendimiento del dispositivo **S10** es mediocre, mientras que el rendimiento de **Tab S8+** es aceptable, y el rendimiento de **S24** es decente.


### QEMU

Si los resultados de los benchmarks fueron buenos, o si simplemente querés continuar con la emulación, comenzá instalando el software para este fin. Ejecutá el siguiente comando para instalar QEMU y otros paquetes necesarios.

```bash
pkg install qemu-utils qemu-common qemu-system-x86-64-headless
```


### Alpine Linux

Ya vimos el proceso para [Instalar Alpine Linux](@/blog/2025/07/2025-07-07_-_vm-guest-os-alpine.es.md). Ahora podés reutilizar el mismo proceso, excepto por cómo llamás al comando QEMU.

Comenzá siguiendo las instrucciones del articulo, pero ignorá la sección de validación "GPG" en [Integridad y Autenticidad de los Archivos](@/blog/2025/07/2025-07-07_-_vm-guest-os-alpine.es.md#files-integrity-and-authenticity).

Cuando llegues a la sección [Instalar Alpine Linux](@/blog/2025/07/2025-07-07_-_vm-guest-os-alpine.es.md#install-alpine-linux), no ejecutes el comando QEMU; en su lugar, ejecutá el que está debajo de este párrafo. La principal diferencia entre los dos comandos es el uso de la función [Kernel-based Virtual Machine (KVM)](https://en.wikipedia.org/wiki/Kernel-based_Virtual_Machine), que no está disponible en Termux.

```bash
qemu-system-x86_64 \
  -m 1024 \
  -cpu max \
  -accel tcg,thread=multi,tb-size=256 \
  -device virtio-net,netdev=net0 \
  -netdev user,id=net0,hostfwd=tcp::2222-:22 \
  -cdrom "${ALPINE_CD_FILE}" \
  -drive if=virtio,format=qcow2,file="${GUEST_IMAGE_FILE}" \
  -nographic
```

Después del comando anterior, continuá con la publicación de Alpine Linux hasta que llegues a la sección [Ejecutar Alpine Linux](@/blog/2025/07/2025-07-07_-_vm-guest-os-alpine.es.md#run-alpine-linux) y, nuevamente, no ejecutes el comando; en su lugar, ejecutá el que está debajo de este párrafo.

```bash
qemu-system-x86_64 \
  -m 1024 \
  -cpu max \
  -accel tcg,thread=multi,tb-size=256 \
  -device virtio-net,netdev=net0 \
  -netdev user,id=net0,hostfwd=tcp::2222-:22 \
  -drive if=virtio,format=qcow2,file="${GUEST_IMAGE_FILE}" \
  -nographic \
  -display none
```

Luego, podés continuar con la publicación de Alpine Linux. Dado que solo estamos usando el sistema emulado en Termux, no es necesario seguir los pasos de la última sección, [Convertir Imagen de Disco](@/blog/2025/07/2025-07-07_-_vm-guest-os-alpine.es.md#convert-disk-image), por lo que podés ignorarlos. Pero, como medida de seguridad, podés hacer un backup de la imagen del disco con el siguiente comando.

```bash
xz -k -6e "${GUEST_IMAGE_FILE}"
```

En los anteriores comandos de QEMU, he configurado el parámetro del acelerador como `-accel tcg,thread=multi,tb-size=256` debido a los benchmarks en la sección [QEMU & Alpine Linux](#qemu-alpine-linux). No dudes en ejecutar los benchmarks para ver si un valor diferente funciona mejor en tu dispositivo.


### Encendido

Ahora que Alpine Linux está listo, podés iniciarlo con el siguiente comando. Tené en cuenta que se agregó el parámetro para demonizar QEMU, lo que significa que el proceso se ejecutará en segundo plano.

```bash
qemu-system-x86_64 \
  -m 1024 \
  -cpu max \
  -accel tcg,tb-size=256 \
  -device virtio-net,netdev=net0 \
  -netdev user,id=net0,hostfwd=tcp::2222-:22,hostfwd=tcp::2375-:2375 \
  -drive if=virtio,format=qcow2,file="${GUEST_IMAGE_FILE}" \
  -display none \
  -daemonize
```

Después de iniciar el sistema, esperá hasta que termine de arrancar. Si querés una notificación visual para saber cuándo el sistema está listo, ejecutá el siguiente comando (basado en [estas](https://stackoverflow.com/a/19866239) y [estas](https://stackoverflow.com/a/47166507) respuestas) que te indicará a partir de que momento el servidor SSH está listo para aceptar una conexión.

```bash
while (true); do \
  echo -n '.'; \
  timeout 1 bash -c 'cat < /dev/null > /dev/tcp/localhost/2222' &> /dev/null; \
  if (( 0 == $? )); then \
    echo -n "[PORT 2222 READY]" && break; \
  else \
    sleep '0.5s'; \
  fi; \
done; \
while (true); do \
  echo -n '.'; \
  timeout 1 ssh -o ConnectTimeout=1 -o PubkeyAuthentication=no -o PasswordAuthentication=no -o KbdInteractiveAuthentication=no -o ChallengeResponseAuthentication=no -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o BatchMode=yes -T -q -p 2222 admin@localhost &> /dev/null; \
  if (( 255 == $? )); then \
    echo -n "[SSH READY]" && echo && break; \
  else \
    sleep '0.5s'; \
  fi; \
done
```

A esta altura ya tenés Alpine Linux en funcionamiento y listo para usar. No lo apagues, porque lo necesitás encendido para las siguientes secciones.


### Configuración de Claves SSH

Ahora que tenés funcionando un sistema emulado y ejecutando Alpine Linux, vas a acceder a él con frecuencia. Para facilitar este flujo, usá la autenticación de clave pública para evitar escribir la contraseña cada vez que quieras acceder a Alpine Linux o ejecutar un comando en él.

El primer paso es crear el par de claves pública y privada (sin contraseña) en Termux.

```bash
ssh-keygen -t ed25519 -C "user@termux" -f ~/.ssh/for_alpine
```

Luego, definí la configuración de SSH (cliente) con el siguiente comando. Presta atención a la opción `RemoteForward` que usaremos más adelante.

```bash
cat > ~/.ssh/config <<HEREDOC
Host alpine
  User admin
  Hostname 127.0.0.1
  Port 2222
  IdentityFile $(echo ~/.ssh/for_alpine)
  LogLevel QUIET
  # Reverse SSH Tunnel
  RemoteForward 9000 localhost:8022
  # The following options are insecure but practical for use
  # with local, disposable virtual machines where security
  # is not a concern.
  StrictHostKeyChecking no
  UserKnownHostsFile /dev/null
HEREDOC
```

Ahora, cargá tu clave pública en Alpine Linux.

```bash
ssh-copy-id -i ~/.ssh/for_alpine alpine
```

Podés verificar si todo se ha configurado correctamente ejecutando el siguiente comando, donde la salida debería ser `admin` (o el nombre de usuario que hayas elegido cuando instalaste Alpine). Aquí, estás usando el cliente SSH solo para ejecutar el comando `whoami` dentro de Alpine Linux, sin abrir un shell remoto, y luego ver la salida del comando en tu terminal.

```bash
ssh alpine 'whoami'
```

Usando tu nueva configuración de SSH y siguiendo el mismo patrón, pero a la inversa, ahora creá un par de claves pública y privada (sin contraseña) dentro de Alpine Linux.

```bash
ssh alpine 'ssh-keygen -t ed25519 -C "user@alpine" -f ~/.ssh/for_termux'
```

Luego, definí la clave pública de Alpine como una clave autorizada en Termux.

```bash
ssh alpine 'cat ~/.ssh/for_termux.pub' >> ~/.ssh/authorized_keys
```

Ahora, definí la configuración del cliente SSH en Alpine Linux para conectarte a Termux. Tené en cuenta que estás usando el puerto **9000**, que se relaciona con la configuración `RemoteForward` anterior.

```bash
ssh alpine "printf 'Host termux\n  Hostname 127.0.0.1\n  User $(whoami)\n  Port 9000\n  LogLevel QUIET\n  IdentityFile /home/admin/.ssh/for_termux\n  StrictHostKeyChecking no\n  UserKnownHostsFile /dev/null\n' > ~/.ssh/config"
```

Por último, actualizá la configuración del servidor SSH en Alpine Linux y reiniciá el demonio. Estas actualizaciones, más el `RemoteForward` en el puerto **9000**, te permitirán hacer un [Túnel SSH Inverso](https://en.wikipedia.org/wiki/Reverse_connection).

```bash
ssh alpine "sudo sed -i -e 's/^GatewayPorts no/GatewayPorts yes/' -e 's/^AllowTcpForwarding no/AllowTcpForwarding yes/' /etc/ssh/sshd_config && sudo rc-service sshd restart"
```


Docker
------

Como mencioné en la introducción, Termux estará limitado por el dispositivo. Es por eso que, para ejecutar Docker, has emulado una computadora e instalado Alpine Linux en ella. Pero, en su estado actual, es bastante incómodo iniciar sesión en Alpine cada vez que quieres ejecutar un comando de Docker. Durante la configuración de Alpine Linux, expusiste el puerto **2375**, que permite que un cliente de Docker interactúe con el demonio de Docker.

Al momento de escribir este artículo, no pude encontrar un cliente de Docker en el repositorio de paquetes (`pkg search docker`). Por lo tanto, vas a descargar e instalar el [Cliente de Docker CLI](https://docs.docker.com/reference/cli/docker/) oficial con el siguiente comando (basado en [esta](https://stackoverflow.com/a/57197141) respuesta).

```bash
DOCKER_URL=https://download.docker.com/linux/static/stable/aarch64 && \
DOCKER_VERSION="$(ssh alpine 'docker --version' | grep -o -e '[0-9]\{1,2\}\.[0-9]\{1,2\}\.[0-9]\{1,2\}')" && \
curl -fsSL "${DOCKER_URL}/docker-${DOCKER_VERSION}.tgz" | \
tar zxvf - --strip 1 -C $PREFIX/bin docker/docker
```

Ejecutando el siguiente comando, verifica si `docker` (comando) y la conexión al demonio están funcionando.

```bash
DOCKER_HOST='tcp://localhost:2375' docker version
```

La salida del comando anterior debería ser algo como el texto que se muestra a continuación.

```
Client:
 Version:           27.3.1
 API version:       1.47
 Go version:        go1.22.7
 Git commit:        ce12230
 Built:             Fri Sep 20 11:38:50 2024
 OS/Arch:           linux/arm64
 Context:           default

Server:
 Engine:
  Version:          27.3.1
  API version:      1.47 (minimum version 1.24)
  Go version:       go1.23.9
  Git commit:       41ca978a0a5400cc24b274137efa9f25517fcc0b
  Built:            Thu May  8 20:02:17 2025
  OS/Arch:          linux/amd64
  Experimental:     false
 containerd:
  Version:          v2.0.0
  GitCommit:        207ad711eabd375a01713109a8a197d197ff6542
 runc:
  Version:          1.2.2
  GitCommit:        7cb363254b69e10320360b63fb73e0ffb5da7bf2
 docker-init:
  Version:          0.19.0
  GitCommit:
```

Hay diferentes maneras de indicarle a Docker dónde está ubicado el demonio. Una es a través de la variable de entorno que usaste en el comando anterior. Otra es usando un [contexto de Docker](https://docs.docker.com/engine/manage-resources/contexts/). Definamos el contexto **alpine** con el siguiente comando.

```bash
docker context create alpine --docker "host=tcp://localhost:2375"
```

Podes verificar lo anterior usando el contexto recién creado y llamando al comando `version`, donde deberías ver la misma salida que antes.

```bash
docker --context alpine version
```

Si el comando funcionó como se esperaba, continuemos definiendo el contexto como el predeterminado.

```bash
docker context use alpine
```

Luego, ejecuta un contenedor desde la imagen [hello-world](https://hub.docker.com/_/hello-world) para confirmar que todo está funcionando bien.

```bash
docker run hello-world
```


### SSHFS

En algún momento es posible que quieras compartir archivos entre Termux y tu sistema emulado con Alpine Linux. Por ejemplo, esto podría ser necesario si quieres hacer un [bind mount](https://docs.docker.com/engine/storage/bind-mounts/) con Docker.

Una solución, aprovechando el túnel inverso que configuramos anteriormente, es usar [SSH Filesystem (SSHFS)](https://en.wikipedia.org/wiki/SSHFS).

Comencemos creando un directorio **workspace** en el directorio de inicio del usuario tanto en Termux como en Alpine.

```bash
mkdir ~/workspace && ssh alpine 'mkdir ~/workspace'
```

Luego, dentro de Alpine, instalá los paquetes necesarios para poder montar tu directorio compartido.

```bash
ssh alpine 'sudo apk add --no-cache --no-interactive sshfs && echo fuse | sudo tee -a /etc/modules && sudo modprobe fuse'
```

Ahora, con el siguiente comando, monta el directorio **workspace** desde Termux en Alpine. La opción `-f` le solicita a SSH que se ejecute en segundo plano, ya que seguirá actuando como un servidor.

```bash
ssh -f alpine "sshfs -o idmap=user termux:$(echo ~)/workspace /home/admin/workspace"
```

Para probar si el directorio compartido está funcionando, crea un archivo desde Alpine y mostrá el contenido desde Termux.

```bash
ssh alpine 'echo "From Alpine: $(uname -a)" > ~/workspace/test.txt' && cat ~/workspace/test.txt
```

Y también hacelo al revés.

```bash
echo "From Termux: $(uname -a)" >> ~/workspace/test.txt && ssh alpine 'cat ~/workspace/test.txt'
```

Cuando quieras dejar de compartir el directorio, desmontalo ejecutando el siguiente comando.

```bash
ssh alpine 'sudo umount ~/workspace'
```


Virtual Hosts
-------------

Si vas a usar Termux para desarrollo web, en algún momento necesitarás trabajar con diferentes [nombres de host](https://en.wikipedia.org/wiki/Hostname). Normalmente, simplemente actualizarías el [archivo hosts](https://en.wikipedia.org/wiki/Hosts_%28file%29), pero esto no es posible en Android.

Como solución alternativa para la [restricción de Android](https://android.stackexchange.com/a/174520), instalá la aplicación [Virtual Hosts](https://github.com/x-falcon/Virtual-Hosts).

Esta aplicación te permite establecer nombres de host en Android en modo VPN. Para que funcione, crea un archivo con contenido como el siguiente ejemplo y carga el archivo con la aplicación.

```bash
cat > ~/storage/downloads/hosts.txt <<HEREDOC
127.0.0.1 localhost
127.0.0.1 .wildcard.local
127.0.0.1 www.example.local
HEREDOC
```

Si cargas el archivo del ejemplo anterior, podrás hacer ping a un subdominio desde el dominio *wildcard*, como en el siguiente comando.

```bash
ping -c 5 subdomain.wildcard.local
```

Ahora intentemos acceder a un servidor HTTP a través de un nombre de host del ejemplo anterior. Para esto, ejecuta un contenedor desde la pequeña imagen [Hello World HTTP](https://github.com/kljensen/hello-world-http).

```bash
docker run \
  --detach \
  --env HOST=0.0.0.0 \
  --env PORT=80 \
  --publish 8080:80 \
  --name hello \
  --rm \
  ghcr.io/kljensen/hello-world-http
```

Luego, ejecuta el siguiente comando para crear un túnel SSH que te permitirá acceder al puerto **8080** publicado dentro de Alpine Linux, desde el puerto **8000** en tu dispositivo host (Android).

```bash
ssh -f -N -L 8000:localhost:8080 alpine
```

Si todo funciona correctamente, vas a poder ver la salida "**hello world**" ejecutando el siguiente comando.

```bash
echo $(curl -s www.example.local:8000)
```

También deberías ver la misma salida ingresando el nombre de host y el puerto en tu navegador web, como en la siguiente captura de pantalla.

{{ internal_link(name="Navegador web: Mostrar mensaje 'hello world' desde el servicio local que se ejecuta en el contenedor", path="assets/20250713-termux-android-linux/virtual_hosts_001.png") }}

Si querés ver los logs que el servidor HTTP deja cada vez que un cliente realiza una solicitud, podes hacerlo con el siguiente comando.

```bash
docker logs hello
```

Una vez que finalices tus pruebas, apaga la computadora emulada ejecutando el siguiente comando.

```bash
ssh alpine 'sudo poweroff'
```


Benchmarks
----------

En esta sección, voy a ejecutar una serie de [benchmarks](https://en.wikipedia.org/wiki/Benchmark_%28computing%29) que, espero, funcionen como referencia. Voy a usar [hyperfine](https://github.com/sharkdp/hyperfine) para obtener las métricas. Instalémoslo ejecutando el siguiente comando.

```bash
pkg install hyperfine
```

Los dispositivos que he usado para los benchmarks son (ordenados del más lento al más rápido):

* Samsung Galaxy S10e (SM-G970U1) - Android 12
* Samsung Galaxy Tab S8+ (SM-X800) - Android 15
* Samsung Galaxy S24 (SM-S921U1) - Android 15


### Dispositivo {#device}

Acá, vamos a obtener las métricas para conocer el rendimiento de los dispositivos al ejecutar una serie de comandos en Termux. Por supuesto, hay muchas maneras de hacer esto; [acá](https://askubuntu.com/questions/634513/cpu-benchmarking-utility-for-linux) podes ver otras opciones. Pero a continuación se muestra el comando que vamos a usar para nuestro benchmark.

```bash
hyperfine \
  --warmup 2 \
  --export-markdown benchmark.md \
  --command-name "gzip random" \
  --command-name "gzip zeros" \
  --command-name "zero 2 null" \
  --command-name "zero 2 file" \
  --command-name "file 2 null" \
  "cat </dev/urandom | head -c 100M | gzip >/dev/null" \
  "cat </dev/zero | head -c 100M | gzip >/dev/null" \
  "dd if=/dev/zero of=/dev/null bs=1M count=1024" \
  "dd if=/dev/zero of=testfile bs=1M count=100 oflag=direct,sync" \
  "dd if=testfile of=/dev/null bs=1M iflag=direct" && \
rm testfile
```

A continuación, se muestran los resultados del benchmark anterior.

#### S10

| Command     |      Mean [s] | Min [s] | Max [s] |
|:------------|--------------:|--------:|--------:|
| gzip random | 3.291 ± 0.008 |  3.281  |  3.305  |
| gzip zeros  | 1.946 ± 0.067 |  1.871  |  2.076  |
| zero 2 null | 0.111 ± 0.014 |  0.090  |  0.135  |
| zero 2 file | 0.988 ± 0.022 |  0.967  |  1.029  |
| file 2 null | 0.129 ± 0.012 |  0.122  |  0.164  |

#### Tab S8+

| Command     |      Mean [s] | Min [s] | Max [s] |
|:------------|--------------:|--------:|--------:|
| gzip random | 3.164 ± 0.005 |   3.156 |   3.174 |
| gzip zeros  | 0.492 ± 0.005 |   0.484 |   0.503 |
| zero 2 null | 0.091 ± 0.003 |   0.085 |   0.099 |
| zero 2 file | 0.501 ± 0.027 |   0.458 |   0.541 |
| file 2 null | 0.089 ± 0.005 |   0.082 |   0.109 |

#### S24

| Command     |      Mean [s] | Min [s] | Max [s] |
|:------------|--------------:|--------:|--------:|
| gzip random | 2.253 ± 0.028 |   2.206 |   2.298 |
| gzip zeros  | 0.450 ± 0.125 |   0.357 |   0.727 |
| zero 2 null | 0.054 ± 0.009 |   0.036 |   0.071 |
| zero 2 file | 0.132 ± 0.017 |   0.104 |   0.161 |
| file 2 null | 0.040 ± 0.006 |   0.026 |   0.053 |


### QEMU & Alpine Linux

Acá, vamos a medir cuánto tiempo tarda en arrancar Alpine Linux configurando diferentes valores en el parámetro de aceleración de QEMU.

Antes de avanzar, asegurate de tener una copia de seguridad del archivo de imagen de disco. Una vez que terminemos los benchmarks, vamos a restaurar la imagen de disco desde la copia de seguridad porque la imagen utilizada en el benchmark se volverá inutilizable.

Comencemos iniciando Alpine Linux. Inicia sesión, cambia al usuario **root** (`sudo su`) y ejecuta el comando que está debajo de este párrafo, que es una variación de [esta respuesta](https://unix.stackexchange.com/a/748919). Luego, ejecuta el comando `poweroff` para apagar el sistema. Esta actualización hará que Alpine Linux se apague inmediatamente después de que termine de arrancar.

```bash
cat > /etc/init.d/boot-poweroff <<HEREDOC && chmod +x /etc/init.d/boot-poweroff && rc-update add boot-poweroff default
#!/sbin/openrc-run

description="Instantly poweroff"

depend() {
    after *
}

start() {
    poweroff -n -f
}
HEREDOC
```

Ahora, inicia el proceso de benchmark donde vamos a medir cuánto tiempo tarda en arrancar Alpine Linux usando diferentes valores para el parámetro de acelerador de QEMU.

```bash
QEMU_COMMAND='qemu-system-x86_64 -m 1024 -cpu max -nographic -display none -drive if=virtio,format=qcow2,file=alpine-3.21.3-x86_64.qcow2' && \
hyperfine \
  --export-markdown benchmark.md \
  --command-name "no accel" \
  --command-name "tcg" \
  --command-name "tcg 64" \
  --command-name "tcg 128" \
  --command-name "tcg 256" \
  --command-name "tcg 512" \
  --command-name "multi" \
  --command-name "multi 64" \
  --command-name "multi 128" \
  --command-name "multi 256" \
  --command-name "multi 512" \
  "${QEMU_COMMAND}" \
  "${QEMU_COMMAND} -accel tcg" \
  "${QEMU_COMMAND} -accel tcg,tb-size=64" \
  "${QEMU_COMMAND} -accel tcg,tb-size=128" \
  "${QEMU_COMMAND} -accel tcg,tb-size=256" \
  "${QEMU_COMMAND} -accel tcg,tb-size=512" \
  "${QEMU_COMMAND} -accel tcg,thread=multi" \
  "${QEMU_COMMAND} -accel tcg,thread=multi,tb-size=64" \
  "${QEMU_COMMAND} -accel tcg,thread=multi,tb-size=128" \
  "${QEMU_COMMAND} -accel tcg,thread=multi,tb-size=256" \
  "${QEMU_COMMAND} -accel tcg,thread=multi,tb-size=512"
```

A continuación, se muestran los resultados del benchmark anterior.

#### S10

| Command   |        Mean [s] | Min [s] | Max [s] |
|:----------|----------------:|--------:|--------:|
| no accel  | 263.132 ± 2.027 | 260.076 | 266.268 |
| tcg       | 262.580 ± 1.581 | 260.145 | 264.323 |
| tcg 64    | 134.459 ± 1.053 | 133.011 | 135.767 |
| tcg 128   | 134.601 ± 1.346 | 131.871 | 136.281 |
| tcg 256   | 130.821 ± 1.417 | 127.768 | 132.964 |
| tcg 512   | 263.047 ± 1.528 | 259.954 | 264.834 |
| multi     | 268.453 ± 4.896 | 260.118 | 273.295 |
| multi 64  | 135.278 ± 1.215 | 133.404 | 138.026 |
| multi 128 | 133.111 ± 0.984 | 131.444 | 134.416 |
| multi 256 | 130.018 ± 1.337 | 127.972 | 131.642 |
| multi 512 | 261.444 ± 1.484 | 258.898 | 263.634 |

#### Tab S8+

| Command   |        Mean [s] | Min [s] | Max [s] |
|:----------|----------------:|--------:|--------:|
| no accel  | 102.830 ± 1.029 | 100.267 | 103.840 |
| tcg       | 103.333 ± 0.527 | 102.523 | 103.898 |
| tcg 64    |  83.956 ± 6.616 |  80.569 | 102.683 |
| tcg 128   |  81.207 ± 0.602 |  80.134 |  82.164 |
| tcg 256   |  79.594 ± 0.498 |  78.935 |  80.569 |
| tcg 512   | 102.858 ± 0.491 | 101.860 | 103.690 |
| multi     | 103.341 ± 0.861 | 101.845 | 104.227 |
| multi 64  |  82.179 ± 1.152 |  80.360 |  84.330 |
| multi 128 |  80.788 ± 0.617 |  79.660 |  81.607 |
| multi 256 |  79.428 ± 0.707 |  77.929 |  80.079 |
| multi 512 | 102.104 ± 0.598 | 100.763 | 103.138 |

#### S24

| Command   |       Mean [s] | Min [s] | Max [s] |
|:----------|---------------:|--------:|--------:|
| no accel  | 81.565 ± 3.238 |  76.254 |  85.004 |
| tcg       | 85.505 ± 0.821 |  84.393 |  86.848 |
| tcg 64    | 65.404 ± 2.664 |  62.448 |  69.785 |
| tcg 128   | 69.566 ± 1.185 |  68.190 |  70.990 |
| tcg 256   | 71.247 ± 2.131 |  69.761 |  76.990 |
| tcg 512   | 84.454 ± 2.027 |  82.643 |  89.631 |
| multi     | 82.885 ± 4.161 |  75.824 |  87.478 |
| multi 64  | 74.087 ± 0.987 |  72.827 |  76.002 |
| multi 128 | 70.120 ± 1.277 |  68.652 |  72.099 |
| multi 256 | 71.104 ± 0.683 |  70.060 |  72.256 |
| multi 512 | 84.439 ± 0.639 |  83.471 |  85.473 |


### Docker

En esta sección, vamos a medir cuánto tiempo tarda en ejecutarse un contenedor desde la imagen [hello-world](https://hub.docker.com/_/hello-world). El demonio de Docker se ejecutará en Alpine Linux, mientras que el cliente de Docker se ejecutará en Termux.

```bash
hyperfine \
  --warmup 2 \
  --export-markdown benchmark.md \
  --command-name "hello-world" \
  'docker --host localhost:2375 run hello-world'
```

A continuación, se muestran los resultados del benchmark anterior.

| Dispositivo |       Mean [s] | Min [s] | Max [s] |
|:------------|---------------:|--------:|--------:|
| S10         | 17.264 ± 0.995 |  15.845 |  18.946 |
| Tab S8+     | 10.058 ± 0.395 |   9.305 |  10.557 |
| S24         |  7.383 ± 0.361 |   6.779 |   7.767 |


Finalizando
-----------

¡Felicitaciones! ¡Tenés un entorno Linux de bolsillo! Esto te permite practicar, programar, encargarte de tareas operativas y todo tipo de cosas. No es una computadora personal, pero si lo único que tenés es un Android, es una buena alternativa. Espero que esto te haya sido tan útil como lo fue para mí mientras lo escribía. ¡Ahora animate a explorar!

¡Saludos y hasta la próxima!
