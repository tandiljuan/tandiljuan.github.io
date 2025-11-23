+++
title = "Instalando Debian en VirtualBox: Una Guía Paso a Paso"
date = 2025-07-10T18:14:07-03:00
[taxonomies]
tags = ['Debian', 'VirtualBox', 'Virtualization', 'Tutorial']
series = ['Linux Playground From Scratch']
[extra]
add_toc = true
series = true
+++

Esta publicación será breve, pero intenté compensarlo incluyendo varias capturas de pantalla. Veremos cómo crear una máquina virtual e instalar [Debian OS](https://www.debian.org/) usando [VirtualBox](https://www.virtualbox.org/). Describiré dos métodos para instalar Debian: una instalación guiada donde especificaras tus preferencias durante el proceso, y una instalación desatendida donde se leen esas preferencias desde un archivo de configuración para la instalación del sistema operativo.


Crear la Máquina Virtual
------------------------

Antes de instalar cualquier sistema operativo, necesitamos crear la máquina virtual en la que se ejecutará. El primer paso es descargar la [imagen ISO](https://en.wikipedia.org/wiki/Optical_disc_image) del CD del sistema operativo, que utilizaremos para la instalación. Para replicar la configuración de la publicación anterior, utilizaremos la misma versión [bullseye](https://www.debian.org/releases/bullseye/). Descarga la imagen [`debian-11.11.0-amd64-netinst.iso`](https://cdimage.debian.org/cdimage/archive/11.11.0/amd64/iso-cd/debian-11.11.0-amd64-netinst.iso). Opcionalmente, también puedes descargar el archivo [`SHA256SUMS`](https://cdimage.debian.org/cdimage/archive/11.11.0/amd64/iso-cd/SHA256SUMS) para verificar la integridad de la imagen ISO.

Con el siguiente comando puedes descargar ambos archivos.

```bash
curl --location --remote-name-all "https://cdimage.debian.org/cdimage/archive/11.11.0/amd64/iso-cd/{debian-11.11.0-amd64-netinst.iso,SHA256SUMS}"
```

Se puede utilizar el siguiente comando para verificar la integridad de la imagen del disco.

```bash
sha256sum --check --ignore-missing SHA256SUMS
```

Una vez que hayas descargado los archivos y verificado su integridad, abre VirtualBox y crea la máquina virtual.

{{ internal_link(name="Botón para crear una máquina virtual", path="assets/20250710-debian-virtualbox-install-guide/debian_create_001.png") }}

Aparecerá una ventana emergente, pidiéndote que crees la máquina virtual. En esta ventana, selecciona *"Linux"* como el tipo, *"Debian (64-bit)"* como la versión, y la opción *"Create a virtual hard disk now"* (crear un disco duro virtual ahora). Puedes elegir el nombre que quieras. Si bien la memoria mínima [requerida](https://wiki.debian.org/DebianEdu/Documentation/Bullseye/Requirements) es *"256 MiB"*, considera asignar al menos *"512 MiB"* o incluso *"1024 MiB"* si planeas ejecutar [contenedores](https://en.wikipedia.org/wiki/Containerization_%28computing%29).

{{ internal_link(name="Ventana emergente para crear una máquina virtual", path="assets/20250710-debian-virtualbox-install-guide/debian_create_002.png") }}

A continuación, aparecerá una ventana emergente para crear el disco duro virtual. Selecciona *"VDI (VirtualBox Disk Image)"* y *"Dynamically allocated"* (tamaño dinámico). Nuevamente, puedes elegir el nombre que prefieras. Debido a que el espacio de disco se asigna dinámicamente, el tamaño del archivo se puede establecer en los recomendados *"30 GiB"*. Como referencia, el espacio en disco utilizado por la instalación en esta publicación fue de aproximadamente *900 MiB*.

{{ internal_link(name="Ventana emergente para crear un disco duro virtual", path="assets/20250710-debian-virtualbox-install-guide/debian_create_003.png") }}

Una vez creada la máquina virtual, asegúrate de que la interfaz de red virtual esté habilitada. Para ello, selecciona la máquina virtual, haz clic en el botón *"Settings"* (configuración) y ve a la sección *"Network"* (red). Marca la casilla para habilitar el adaptador de red #1 y selecciona el [modo de red](https://www.virtualbox.org/manual/topics/networkingdetails.html#networkingmodes) deseado. Seleccionar *"NAT"* es generalmente la mejor opción. Si seleccionas *"NAT"*, también configura el reenvío de puertos desde el puerto del host *2222* al puerto del invitado *22* para habilitar el acceso a través de SSH.

{{ internal_link(name="Configuración de red de la máquina virtual", path="assets/20250710-debian-virtualbox-install-guide/debian_create_004.png") }}

El último paso antes de la instalación del sistema operativo es cargar la imagen del CD. En la ventana emergente de configuración, navega a la sección *"Storage"* (almacenamiento). En el dispositivo IDE vacío, haz clic en el icono del CD para cargar el archivo ISO que descargaste anteriormente.

{{ internal_link(name="Máquina virtual cargar archivo de imagen de disco", path="assets/20250710-debian-virtualbox-install-guide/debian_create_005.png") }}

Una vez que la imagen está cargada, el dispositivo IDE mostrará el nombre del archivo ISO.

{{ internal_link(name="CD ISO de la máquina virtual cargado", path="assets/20250710-debian-virtualbox-install-guide/debian_create_006.png") }}

Luego de terminar con los pasos anteriores, la máquina virtual estará lista para la instalación del sistema operativo. Inicia la máquina virtual y elige tu método de instalación preferido: guiado o desatendido.


Instalación Guiada
------------------

La instalación guiada es sencilla, pero requiere una atención cuidadosa para seleccionar las opciones correctas en cada paso. A continuación, se muestra un resumen de los pasos, seguido de capturas de pantalla para tener como referencia.

* Arranque del sistema: Selecciona la opción *"Install"* (instalar).
* Localización del sistema: Establece el idioma, la ubicación y el teclado.
* Red: Establece un nombre de host e ignora el nombre de dominio.
* Usuarios: Establece la contraseña de **root** y el administrador (nombre, nombre de usuario y contraseña).
* Proceso de partición del disco:
    + Método: Selecciona *"Guided - use entire disk"* (guiado - utilizar todo el disco).
    + Disco: (Selecciona la única opción) *"SCSI1 (0,0,0) (sda) - 5.4 GB ATA VBOX HARDDISK"*.
    + Esquema de partición: Selecciona *"All files in one partition"* (todos los ficheros en una partición).
    + Finaliza seleccionando *"Finish partitioning and write changes to disk"* (finalizar el particionado y escribir los cambios en el disco).
    + Confirma respondiendo *"Yes"* (si) a la pregunta *"Write the changes to disk?"* (¿desea escribir los cambios en los discos?).
* Barra que muestra el progreso de la instalación del sistema base.
* Gestor de paquetes: No escanees medios de instalación adicionales, deja las opciones predeterminadas y no establezcas un proxy (déjalo vacío).
* Software: Sólo selecciona el servidor SSH y las utilidades estándar del sistema.
* Cargador de arranque: Instalalo en el dispositivo *primario* `/dev/sda`.
* Finaliza la instalación: Pulsa *"Continue"* (continuar) para reiniciar el sistema.
* Arranca el sistema operativo Debian recién instalado.
* Inicia sesión con el usuario administrador y comprueba si puede acceder a Internet.

{{ internal_link(name="Instalación guiada: Selecciona la opción Instalar", path="assets/20250710-debian-virtualbox-install-guide/debian_guided_001.png") }}
{{ internal_link(name="Instalación guiada: Selecciona el idioma", path="assets/20250710-debian-virtualbox-install-guide/debian_guided_002.png") }}
{{ internal_link(name="Instalación guiada: Selecciona la ubicación", path="assets/20250710-debian-virtualbox-install-guide/debian_guided_003.png") }}
{{ internal_link(name="Instalación guiada: Configura el teclado", path="assets/20250710-debian-virtualbox-install-guide/debian_guided_004.png") }}
{{ internal_link(name="Instalación guiada: Establece el nombre del host", path="assets/20250710-debian-virtualbox-install-guide/debian_guided_005.png") }}
{{ internal_link(name="Instalación guiada: Establece el nombre del dominio", path="assets/20250710-debian-virtualbox-install-guide/debian_guided_006.png") }}
{{ internal_link(name="Instalación guiada: Establece la contraseña de root", path="assets/20250710-debian-virtualbox-install-guide/debian_guided_007.png") }}
{{ internal_link(name="Instalación guiada: Establece el nombre completo del usuario", path="assets/20250710-debian-virtualbox-install-guide/debian_guided_008.png") }}
{{ internal_link(name="Instalación guiada: Establece el nombre de usuario", path="assets/20250710-debian-virtualbox-install-guide/debian_guided_009.png") }}
{{ internal_link(name="Instalación guiada: Establece el método de partición", path="assets/20250710-debian-virtualbox-install-guide/debian_guided_010.png") }}
{{ internal_link(name="Instalación guiada: Selecciona el disco a particionar", path="assets/20250710-debian-virtualbox-install-guide/debian_guided_011.png") }}
{{ internal_link(name="Instalación guiada: Selecciona el esquema de partición", path="assets/20250710-debian-virtualbox-install-guide/debian_guided_012.png") }}
{{ internal_link(name="Instalación guiada: Confirma el particionado", path="assets/20250710-debian-virtualbox-install-guide/debian_guided_013.png") }}
{{ internal_link(name="Instalación guiada: Confirma escribir los cambios en el disco", path="assets/20250710-debian-virtualbox-install-guide/debian_guided_014.png") }}
{{ internal_link(name="Instalación guiada: Barra de progreso de la instalación", path="assets/20250710-debian-virtualbox-install-guide/debian_guided_015.png") }}
{{ internal_link(name="Instalación guiada: Escanea medios de instalación adicionales", path="assets/20250710-debian-virtualbox-install-guide/debian_guided_016.png") }}
{{ internal_link(name="Instalación guiada: Establece el país del repositorio de archivo", path="assets/20250710-debian-virtualbox-install-guide/debian_guided_017.png") }}
{{ internal_link(name="Instalación guiada: Establece el nombre de dominio del repositorio de archivo", path="assets/20250710-debian-virtualbox-install-guide/debian_guided_018.png") }}
{{ internal_link(name="Instalación guiada: Establece el proxy del gestor de paquetes", path="assets/20250710-debian-virtualbox-install-guide/debian_guided_019.png") }}
{{ internal_link(name="Instalación guiada: Selecciona el software a instalar", path="assets/20250710-debian-virtualbox-install-guide/debian_guided_020.png") }}
{{ internal_link(name="Instalación guiada: Confirma la instalación del cargador de arranque", path="assets/20250710-debian-virtualbox-install-guide/debian_guided_021.png") }}
{{ internal_link(name="Instalación guiada: Selecciona el dispositivo para el cargador de arranque", path="assets/20250710-debian-virtualbox-install-guide/debian_guided_022.png") }}
{{ internal_link(name="Instalación guiada: Instalación completa", path="assets/20250710-debian-virtualbox-install-guide/debian_guided_023.png") }}
{{ internal_link(name="Instalación guiada: Selecciona el sistema operativo para arrancar", path="assets/20250710-debian-virtualbox-install-guide/debian_guided_024.png") }}
{{ internal_link(name="Instalación guiada: Inicia sesión con el usuario y haz ping a Google", path="assets/20250710-debian-virtualbox-install-guide/debian_guided_025.png") }}


Instalación Desatendida
-----------------------

La instalación desatendida ofrece un enfoque más rápido, que requiere un archivo con los ajustes que normalmente elegirías interactivamente. Puedes encontrar un ejemplo de este tipo de archivo [aquí](https://www.debian.org/releases/bullseye/example-preseed.txt). Este archivo es necesario antes de iniciar la instalación. Una vez iniciada, el proceso es totalmente automatizado: no necesitarás intervenir hasta que se complete la instalación, se reinicie la máquina virtual y veas el indicador de inicio de sesión. Si estás interesado, he subido el {{ internal_link(name="archivo preseed", path="assets/20250710-debian-virtualbox-install-guide/debian-11.11.0-preseed.cfg") }} que utilicé para esta publicación.

Para obtener más información, consulta la documentación oficial de [Preseed](https://wiki.debian.org/DebianInstaller/Preseed). Ten en cuenta que, aunque se indica como opción que se puede cargar el archivo desde un disquete, esto [no funciona](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=783982).

A continuación, se muestra un resumen de los pasos de la instalación desatendida, seguido de capturas de pantalla para tener como referencia.

* Arranque del sistema: Selecciona *"Advanced options"* (opciones avanzadas), luego *"Automated install"* (instalación automatizada).
* Archivo de preconfiguración: introduce la URL donde se encuentra el archivo preseed.
* Barra de progreso que muestra el progreso de la instalación.
* Arranca el sistema operativo Debian recién instalado.
* Inicia sesión como **root** y crea el usuario administrador con el siguiente comando

```bash
adduser admin
```

{{ internal_link(name="Instalación desatendida: Selecciona opciones avanzadas", path="assets/20250710-debian-virtualbox-install-guide/debian_unattended_001.png") }}
{{ internal_link(name="Instalación desatendida: Selecciona instalación automatizada", path="assets/20250710-debian-virtualbox-install-guide/debian_unattended_002.png") }}
{{ internal_link(name="Instalación desatendida: Establece la URL al archivo preseed", path="assets/20250710-debian-virtualbox-install-guide/debian_unattended_003.png") }}
{{ internal_link(name="Instalación desatendida: Barra de progreso de la instalación", path="assets/20250710-debian-virtualbox-install-guide/debian_unattended_004.png") }}
{{ internal_link(name="Instalación desatendida: Selecciona el sistema operativo para arrancar", path="assets/20250710-debian-virtualbox-install-guide/debian_guided_024.png") }}
{{ internal_link(name="Instalación desatendida: Inicia sesión como root y crea el usuario administrador", path="assets/20250710-debian-virtualbox-install-guide/debian_unattended_005.png") }}


Configuración del Sistema
-------------------------

Después de terminar con cualquiera de los métodos de instalación, recomiendo instalar `sudo` para simplificar las tareas de administración del sistema. Suponiendo que iniciaste sesión como usuario administrador a través de SSH, cambia al usuario **root** con:

```bash
su -
```

A continuación, actualiza el repositorio de paquetes, instala *"sudo"*, añade el usuario administrador al grupo *"sudo"* y configura el sistema para permitir la ejecución de `sudo` sin contraseña. A continuación, se muestra el comando para lograr esto, seguido de una captura de pantalla como referencia.

```bash
apt update && \
apt install --no-install-recommends sudo && \
adduser admin sudo && \
sed -i -e 's/^%sudo.*/%sudo ALL=(ALL) NOPASSWD: ALL/g' /etc/sudoers
```

{{ internal_link(name="Instalar y configurar sudo", path="assets/20250710-debian-virtualbox-install-guide/debian_unattended_006.png") }}

Ahora puedes instalar cualquier aplicación que necesites. Te sugiero que revises las [aplicaciones recomendadas](@/blog/2024/12/2024-12-23_-_vm-guest-os-debian.es.md#nice-to-have-software-tools) que se instalaron en la publicación anterior.


Copia de Seguridad del Disco Duro Virtual
-----------------------------------------

Como paso final, hagamos una copia de seguridad del disco duro virtual. Esto te permitirá crear rápidamente una nueva máquina virtual de Debian si algo sale mal o compartir la copia de seguridad del disco con otros. A continuación, se muestran los comandos que utilicé. Recuerda adaptar estos comandos con tus ubicaciones y nombres de archivo. Esto resultará en un archivo *"VDI"* comprimido con *bzip2*.

```bash
cd ~/VirtualBox \VMs/sandbox/
bzip2 --keep sandbox.vdi
mv sandbox.vdi.bz2 /ruta/a/copias/de/backup/
```


Finalizando
-----------

¡Bien hecho! Has instalado correctamente Debian en VirtualBox. Ahora tienes un entorno virtual donde puedes experimentar de forma segura con la línea de comandos, explorar el ecosistema GNU/Linux y configurar tus herramientas de desarrollo. Espero que este tutorial haya sido un recurso valioso para ti. ¡Feliz hacking!

¡Saludos y hasta la próxima!
