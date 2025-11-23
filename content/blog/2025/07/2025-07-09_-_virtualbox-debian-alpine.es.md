+++
title = "VirtualBox: Ejecutando Imágenes Preconfiguradas de Debian y Alpine"
date = 2025-07-09T18:18:14-03:00
[taxonomies]
tags = ['VirtualBox', 'Virtualization', 'Debian', 'Alpine Linux']
series = ['Linux Playground From Scratch']
[extra]
add_toc = true
series = true
+++

En esta guía, vamos a ver cómo ejecutar una VM de [VirtualBox](https://www.virtualbox.org/) usando las imágenes creadas en los posts anteriores.

El primer paso es descargar e instalar VirtualBox. Estas instrucciones están fuera del alcance del artículo, pero las vas a encontrar en la [guía del usuario](https://www.virtualbox.org/manual/) oficial. Asegurate de descargar la versión adecuada para tu sistema operativo. En este post se usa la **versión 5.2 de VirtualBox**, versiones más nuevas podrían tener una interfaz diferente.


Crear una VM usando la GUI
--------------------------

Una vez que la aplicación VirtualBox está instalada y funcionando, es hora de crear una nueva VM. Hacé clic en el botón "New" (Nuevo) en la ventana principal.

{{ internal_link(name="Button to Create a Virtual Machine", path="assets/20250709-virtualbox-debian-alpine/virtualbox_001.png") }}

En la ventana que aparece, poné un **nombre** (name) para la VM (en este ejemplo, `sandbox`), seleccioná el **tipo** (type) `Linux`, la **versión** `Other Linux (64-bit)`, configurá el **tamaño de memoria** (memory size - `512 MB` esta bien para empezar), y elegí **"use an existing virtual hard disk file"** (usar un archivo de disco duro virtual existente) para seleccionar uno de los archivos `.vdi` de los posts anteriores. Acá vamos a usar la imagen de Debian, pero la de Alpine funciona igual.

{{ internal_link(name="Window to Create a Virtual Machine", path="assets/20250709-virtualbox-debian-alpine/virtualbox_002.png") }}

Después de crear la VM, hacé clic en el botón **Start** (Iniciar) para ejecutarla.

{{ internal_link(name="Button to Start the Virtual Machine", path="assets/20250709-virtualbox-debian-alpine/virtualbox_003.png") }}

Una vez que la VM termine de arrancar, iniciá sesión con la cuenta de usuario (en éste ejemplo, **user** es `admin` y **pass** es `admin`). Después de que aparezca el [prompt](https://en.wikipedia.org/wiki/Command-line_interface#Command_prompt), usá [`ping`](https://en.wikipedia.org/wiki/Ping_%28networking_utility%29) para probar la conectividad con el [DNS público de Google](https://developers.google.com/speed/public-dns). Abortá con [`Ctrl+c`](https://en.wikipedia.org/wiki/Control-C#In_command-line_environments). Después apagá la VM usando `sudo poweroff`.

{{ internal_link(name="Access the Virtual Machine", path="assets/20250709-virtualbox-debian-alpine/virtualbox_004.png") }}

Si no tenes acceso a Internet, probá cambiando el adaptador de red de [**NAT**](https://www.virtualbox.org/manual/ch06.html#network_nat_service) a [**Bridged Adapter**](https://www.virtualbox.org/manual/ch06.html#network_bridged) (adaptador Puente), o cambiando el **adapter type** (tipo de adaptador). Esto podría solucionar el problema ya que _NAT_ comparte la conexión del host, mientras que el _Adaptador Puente_ crea una conexión directa a la red.

{{ internal_link(name="Network Settings", path="assets/20250709-virtualbox-debian-alpine/virtualbox_005.png") }}

{{ internal_link(name="NAT and Bridge Options", path="assets/20250709-virtualbox-debian-alpine/virtualbox_006.png") }}


Accediendo a través de SSH
--------------------------

Ambas imágenes (Debian y Alpine) incluyen un servidor SSH, permitiendo el acceso remoto a la VM. Esto proporciona una mejor experiencia, incluyendo copiar/pegar y scroll. Si estás usando **NAT**, empezá por reenviar el puerto **22** al **2222** en el host.

{{ internal_link(name="Port Forwarding", path="assets/20250709-virtualbox-debian-alpine/virtualbox_007.png") }}

Iniciá la VM en modo **Headless** para que no se muestre la ventana, o en modo normal si preferís ver la ventana.

{{ internal_link(name="Headless Start", path="assets/20250709-virtualbox-debian-alpine/virtualbox_008.png") }}

Una vez que la VM esté corriendo, estamos listos para iniciar sesión usando un cliente de SSH. En Windows, [PuTTY](https://en.wikipedia.org/wiki/PuTTY) es una opción clásica, pero Windows 10+ incluye un [cliente integrado](https://learn.microsoft.com/en-us/windows/terminal/tutorials/ssh). En Linux, usá:

```bash
ssh -q -p 2222 \
    -o "StrictHostKeyChecking=no" \
    -o "UserKnownHostsFile=/dev/null" \
    admin@localhost
```

{{ internal_link(name="SSH Access", path="assets/20250709-virtualbox-debian-alpine/virtualbox_009.png") }}


Crear una VM usando la CLI
--------------------------

En esta sección, crearemos la misma máquina virtual (VM) que configuramos en las secciones anteriores, pero esta vez utilizando únicamente la línea de comandos. Los siguientes comandos asumen que nos encontramos en el directorio donde se almacenará todo lo relacionado con la VM, incluido el archivo del disco duro virtual.

Abajo, vamos a configurar las variables de entorno con los valores que vamos a usar en esta sección. Sentite libre de cambiar estos valores para que coincidan con tus necesidades.

```bash
VBOX_VM_PATH="$(pwd)"
VBOX_VM_NAME="sandbox"
VBOX_HD_FILE="debian-bullseye-amd64.vdi"
VBOX_HD_NAME="${VBOX_VM_NAME} Storage Controller"
```

Empecemos creando la VM con el siguiente comando.

```bash
VBoxManage createvm \
    --basefolder "${VBOX_VM_PATH}" \
    --name "${VBOX_VM_NAME}" \
    --ostype "Linux_64" \
    --register
```

Después, tenemos que cambiar algunas configuraciones de la VM con el siguiente comando. De la lista de parámetros, tenemos `ioapic` para habilitar I/O APIC (Advanced Programmable Interrupt Controller) que permite una mejor gestión de las interrupciones, `rtcuseutc` para configurar el reloj de hardware en tiempo UTC, `memory` para configurar la memoria de la VM (en nuestro ejemplo, **512 MB**), `vram` para configurar la memoria de video (en nuestro ejemplo, **16 MB**), y `nic1` para configurar el tipo de red para la primera (**1**) tarjeta de red virtual.

Lo que se explicó para la interfaz gráfica también aplica acá; en lugar de **nat**, podemos elegir **bridged** (o cualquier otro tipo). Acá está la lista completa de opciones para el parámetro de tipo de red: `[--nic<1-N> none|null|nat|bridged|intnet|hostonly|generic|natnetwork]`.

```bash
VBoxManage modifyvm "${VBOX_VM_NAME}" \
    --ioapic on \
    --rtcuseutc on \
    --memory 512 \
    --vram 16 \
    --nic1 nat
```

También, podemos cambiar el hardware de red. Abajo hay un ejemplo donde seleccionamos `virtio`. Esta es la lista completa de opciones: `[--nictype<1-N> Am79C970A|Am79C973|82540EM|82543GC|82545EM|virtio]`.

```bash
VBoxManage modifyvm "${VBOX_VM_NAME}" --nictype1 "virtio"
```

Después, conectá el controlador de almacenamiento a la VM.

```bash
VBoxManage storagectl "${VBOX_VM_NAME}" \
    --name "${VBOX_HD_NAME}" \
    --add "ide" \
    --controller "PIIX4"
```

Luego, conectá el medio de almacenamiento (el archivo de disco duro virtual) al controlador de almacenamiento anterior.

```bash
VBoxManage storageattach "${VBOX_VM_NAME}" \
    --storagectl "${VBOX_HD_NAME}" \
    --medium "${VBOX_VM_PATH}/${VBOX_HD_FILE}" \
    --type "hdd" \
    --port 0 \
    --device 0
```

Con el último comando, terminamos de crear y configurar la VM. Pero, si queremos acceder a la VM a través de una conexión SSH, vamos a tener que configurar el reenvío de puertos con el parámetro `natpf1`, como en el ejemplo de abajo. Acá está la documentación del uso del parámetro: `[--natpf<1-N> [<rulename>],tcp|udp,[<hostip>],<hostport>,[<guestip>],<guestport>]`.

```bash
VBoxManage modifyvm "${VBOX_VM_NAME}" --natpf1 "ssh,tcp,,2222,,22"
```

Iniciemos la VM en segundo plano con el modo headless (sin ventana) usando el siguiente comando. Luego, vamos a poder acceder a ella a través de SSH. Si no tenés un cliente SSH, no uses el parámetro `--type "headless"`.

```bash
VBoxManage startvm "${VBOX_VM_NAME}" --type "headless"
```

Para apagar la VM, podés usar el comando `poweroff` desde el sistema operativo corriendo en la VM. Pero también podemos hacerlo desde el host, usando el comando VBoxManage `acpipowerbutton`. Abajo está la documentación oficial del comando, y a continuación hay un ejemplo de cómo podés usarlo.

> Envía una señal de apagado ACPI a la VM, como si se hubiera presionado el botón de encendido en una computadora real. Siempre que la VM esté ejecutando un sistema operativo invitado bastante moderno que proporcione soporte ACPI, esto debería activar un mecanismo de apagado adecuado desde dentro de la VM.

```bash
VBoxManage controlvm "${VBOX_VM_NAME}" acpipowerbutton
```

Pero si la VM no responde a ningún comando, siempre tenés la opción de apagarla a la fuerza con el comando VBoxManage `poweroff`. Abajo está la documentación oficial del comando, y a continuación hay un ejemplo de cómo podés usarlo.

> Tiene el mismo efecto en una máquina virtual que tirar del cable de alimentación en una computadora real. El estado de la VM no se guarda de antemano y se pueden perder datos. Esto es equivalente a seleccionar el elemento Cerrar en el menú Máquina de la GUI, o hacer clic en el botón de cerrar de la ventana de la VM, y luego seleccionar Apagar la máquina en el diálogo que se muestra.

```bash
VBoxManage controlvm "${VBOX_VM_NAME}" poweroff
```


Red Interna con el Host
-----------------------

El reenvío de puertos es una buena característica cuando necesitamos compartir uno o dos servicios desde el invitado al host, como SSH y un servidor web. Pero tan pronto como necesitamos compartir más servicios o acceder al host desde el invitado, el reenvío de puertos no será suficiente. En esta sección, para lograr este objetivo, vamos a ver cómo crear una red solo entre el host y el invitado.

Voy a empezar explicando cómo crear esta red a través de la GUI. Luego, voy a repetir los mismos pasos, pero usando la CLI. Antes de cualquier cambio de red, asegurate de que la máquina virtual esté apagada.


### Interfaz Gráfica de Usuario

Lo primero que tenemos que hacer es crear una interfaz de red virtual. Para hacer esto, andá al *"Host Network Manager"* (administrador de red host) dentro de *"Global Tools"* (herramientas globales).

{{ internal_link(name="xxx", path="assets/20250709-virtualbox-debian-alpine/virtualbox_010.png") }}

Una vez que estés ahí, hacé clic en el botón *"Create"* (crear) para crear la interfaz de red virtual.

{{ internal_link(name="xxx", path="assets/20250709-virtualbox-debian-alpine/virtualbox_011.png") }}

Después, seleccioná la interfaz de red virtual recién creada y hacé clic en el botón *"Properties"* (propiedades). Dejá las opciones por defecto. Como en la siguiente imagen, estoy asumiendo que ya tenés seleccionada la opción *"Configure Adapter Manually"* (configurar adaptador manualmente) y que la *"Dirección IPV4"* del **host** es `192.168.56.1`.

{{ internal_link(name="xxx", path="assets/20250709-virtualbox-debian-alpine/virtualbox_012.png") }}

Hacé clic en la pestaña *"DHCP Server"* (servidor DHCP) y hacé clic en la casilla de verificación para habilitar el servidor. Como en la pestaña anterior, dejá todas las configuraciones por defecto. Acá, vas a ver la IP del servidor, la máscara del servidor, las direcciones inferior y superior que se asignarán. Debido a que vamos a tener solo una máquina virtual corriendo, nuestro sistema operativo invitado obtendrá la IP más baja (primera) de este rango, que es `192.168.56.3`.

{{ internal_link(name="xxx", path="assets/20250709-virtualbox-debian-alpine/virtualbox_013.png") }}

Ahora, volvé a la lista de máquinas virtuales haciendo clic en el botón *"Machine Tools"* (herramientas de la máquina). Asegurate de que nuestra VM sandbox esté seleccionada y hacé clic en el botón *"Settings"* (configuraciones). Bajo la ventana emergente de configuración, seleccioná la sección *"Network"* (red) y hacé clic en la pestaña *"Adapter 2"* (adaptador 2). Este es el nuevo adaptador que vamos a habilitar. Para hacer esto, hacé clic en la casilla de verificación *"Enable Network Adapter"* (habilitar adaptador de red) y conectalo a *"Host-only Adapter"* (adaptador solo para el host). En la lista de selección *"Name"* (nombre), tenemos que asegurarnos de que la interfaz de red virtual recién creada esté seleccionada. Después, guardá los cambios haciendo clic en el botón *"OK"*.

{{ internal_link(name="xxx", path="assets/20250709-virtualbox-debian-alpine/virtualbox_014.png") }}

Vamos a verificar que nuestros últimos cambios estén funcionando bien. Lo primero que vamos a hacer es verificar si el nuevo dispositivo de red aparece dentro del sistema operativo invitado. Iniciá la VM, iniciá sesión y luego ejecutá el siguiente comando.

```bash
ip link | grep '^[0-9]:' | grep -v -E ' (lo|docker)' | cut -d' ' -f2
```

En la salida del comando anterior, deberías ver una lista de dispositivos de red. Al menos deberías ver dos: uno para el dispositivo NAT y el otro para el dispositivo host-only que recién creamos. Abajo hay un ejemplo, pero tené en cuenta que los nombres pueden ser diferentes.

```
enp0s3:
enp0s8:
```

De la lista anterior, necesitamos ver si el último dispositivo se ha configurado correctamente. Estoy asumiendo que el primer dispositivo (NAT) ya está funcionando como se espera. Para esto, ejecutá el siguiente comando.

```bash
ip address | grep 'inet ' | grep -v -E '(127.0.0.1|docker)' | sed 's/^\s*//g'
```

La salida del comando anterior debería ser similar a la siguiente.

```
inet 10.0.2.15/24 brd 10.0.2.255 scope global dynamic noprefixroute enp0s3
inet 192.168.56.3/24 brd 192.168.56.255 scope global dynamic noprefixroute enp0s8
```

Por defecto, Debian configurará el nuevo dispositivo automáticamente, pero Alpine no. En Alpine, tendrías que ver un solo dispositivo en la lista anterior (el dispositivo NAT). Voy a mostrar dos formas de configurar el nuevo dispositivo de red. La primera es ejecutando el comando [`setup-interfaces`](https://wiki.alpinelinux.org/wiki/Configure_Networking#setup-interfaces). Tené en cuenta que este script te pedirá que configures *todos* los dispositivos de red, no solo el nuevo. Para configurar los dispositivos, ejecutá el siguiente comando.

```bash
sudo setup-interfaces
```

Otra forma de configurar manualmente el nuevo dispositivo de red es editando el archivo `/etc/network/interfaces`. Abajo hay un comando que copiará la misma configuración del dispositivo NAT al dispositivo host-only.

```bash
echo -e "\n$(cat /etc/network/interfaces | grep eth0 | sed 's/0/1/g')" | sudo tee -a /etc/network/interfaces
```

Una vez que hayamos verificado que el nuevo dispositivo de red host-only está activo y tiene la dirección IP asignada por el servidor DHCP, podemos confirmar que todo está funcionando bien ejecutando el comando `ping`. Con el siguiente comando, vamos a controlar si podemos ver a nuestra máquina host (`192.168.56.1`) desde el sistema operativo invitado.

```bash
ping -c 3 192.168.56.1
```

Abajo hay una imagen como ejemplo de cómo debería verse el comando anterior.

{{ internal_link(name="xxx", path="assets/20250709-virtualbox-debian-alpine/virtualbox_015.png") }}

Probemos al revés. Pero esta vez, en lugar de hacer ping al invitado desde el host (lo cual, por supuesto, podrías hacer), vamos a ejecutar un servidor [HTTP](https://en.wikipedia.org/wiki/HTTP#HTTP/1.1_response_messages) "ficticio" en el sistema operativo invitado (`192.168.56.3`), y luego vamos a acceder a él usando un navegador web desde la máquina host. Abajo está el código que tenés que ejecutar en el sistema operativo invitado. Es un script simple que entrega contenido HTTP usando [netcat](https://en.wikipedia.org/wiki/Netcat) a través del puerto `8080` y dejará de ejecutarse después del primer paquete de la solicitud. En Alpine Linux, eliminá el parámetro `-W 1`.

```bash
echo -e "HTTP/1.1 200 OK\r\n\r\nUser: $(whoami)\nDate: $(date)\nDirectory:\n$(ls -lha)" | nc -W 1 -l -p 8080
```

Ahora, andá al navegador web, escribí [`192.168.56.3:8080`](http://192.168.56.3:8080) en la barra de direcciones, hacé clic en *Enter*, y deberías ver algo similar a la siguiente imagen.

{{ internal_link(name="xxx", path="assets/20250709-virtualbox-debian-alpine/virtualbox_016.png") }}


### Interfaz de Línea de Comandos

Acá, vamos a replicar lo que hicimos en la sección anterior, pero usando solo la CLI. Empecemos creando una interfaz virtual host-only con el siguiente comando.

```bash
VBoxManage hostonlyif create
```

Después de que termine de crear la interfaz, deberías ver una salida similar a `Interface 'vboxnet0' was successfully created`, donde el número podría ser diferente dependiendo de si ya hay otras interfaces creadas. De ahora en adelante, voy a asumir que la interfaz que queremos usar es la más nueva. Por favor, ajustá los comandos si es necesario. Abajo hay un comando para listar todas las interfaces host-only.

```bash
VBoxManage list hostonlyifs
```

En mi máquina, la salida se veía así.

```
Name:            vboxnet0
GUID:            786f6276-656e-4074-8000-0a0027000000
DHCP:            Disabled
IPAddress:       192.168.56.1
NetworkMask:     255.255.255.0
IPV6Address:
IPV6NetworkMaskPrefixLength: 0
HardwareAddress: 0a:00:27:00:00:00
MediumType:      Ethernet
Wireless:        No
Status:          Down
VBoxNetworkName: HostInterfaceNetworking-vboxnet0
```

Voy a guardar el nombre de la interfaz en una variable de entorno, usando el siguiente comando.

```bash
VBOX_IF_NET="$(VBoxManage list hostonlyifs | grep "^Name" | cut -d':' -f2 | sort | tail -n1 | xargs)"
```

Usando la variable de entorno anterior junto con el siguiente comando, podemos obtener la *"IP Address"* (dirección IP) que se ha configurado automáticamente para la interfaz de red virtual.

```bash
VBOX_IF_IP4="$(VBoxManage list hostonlyifs | sed -E -e 's/\s+/ /g' -e 's/(\w)$/\1,/g' | perl -p -e 's/,\n/,/' | grep "${VBOX_IF_NET}" | grep -o -P 'IPAddress:\s+[\d\.]+' | cut -d' ' -f2)"
```

Luego, podemos habilitar el *"DHCP Server"* (servidor DHCP) con el siguiente comando.

```bash
VBoxManage dhcpserver add \
    --ifname "${VBOX_IF_NET}" \
    --ip "${VBOX_IF_IP4%.*}.2" \
    --netmask "255.255.255.0" \
    --lowerip "${VBOX_IF_IP4%.*}.3" \
    --upperip "${VBOX_IF_IP4%.*}.10" \
    --enable
```

Finalmente, asignamos la interfaz virtual recién creada a nuestra máquina virtual usando el comando de abajo.

```bash
VBoxManage modifyvm "${VBOX_VM_NAME}" \
    --nic2 "hostonly" \
    --nictype2 "virtio" \
    --hostonlyadapter2 "${VBOX_IF_NET}"
```

Ahora, es momento de probar si los cambios anteriores están funcionando como se espera. Voy a iniciar la máquina virtual usando el modo headless.

```bash
VBoxManage startvm "${VBOX_VM_NAME}" --type "headless"
```

Después, iniciá sesión en la VM con SSH y confirmá si el nuevo dispositivo de red host-only está activo y funcionando. En la sección anterior (GUI) se explica cómo hacerlo. Luego, ejecutá el siguiente comando, que es una variación del que ejecutamos en la sección GUI. Este también es un servidor HTTP ficticio, pero se mantendrá activo y devolverá contenido dinámico en cada solicitud realizada al puerto `8080`. Este script tiene una variable que cuenta todas las veces que recibe una solicitud, y su valor se devuelve en la respuesta. Recordá eliminar el parámetro `-W 1` en Alpine Linux.

```bash
i=0; while true; do i=$((i+1)); echo -e "HTTP/1.1 200 OK\r\n\r\nREQUEST #${i}" | nc -W 1 -l -p 8080; done
```

Abrí otra terminal en tu máquina host y ejecutá el siguiente comando para hacer una solicitud HTTP a nuestro sistema operativo invitado (`192.168.56.3`) a través del puerto `8080`. Verás que cada vez que se ejecuta el comando, el número que aparece en la respuesta se incrementará.

```bash
curl 192.168.56.3:8080
```


Finalizando
-----------

En este post, exploramos cómo ejecutar imágenes pre-construidas de Debian y Alpine usando VirtualBox. VirtualBox ofrece una interfaz amigable y está disponible en múltiples plataformas, haciéndolo una excelente opción para gestionar estas VMs. Espero que esta guía te haya sido útil.

¡Saludos y hasta la próxima!
