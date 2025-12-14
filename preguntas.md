1.¿Como funciona realmente tu flujo?

El vendedor solo usa whatsapp
 vendedor se valida manualmente para que pueda conversar con el chatbot 
 el chatbot le dice la secuencia de como se hara la validacion
 vendedor envia una imagen que se extrae
 ejemplo:
    numero de operacion: 12284908 puede llegar a ser de 6 digitos tambien
    codigo de seguridad: 018
    monto: 10
    fecha y hora: 12 dic. 2025
 vendedor escribe numero de telefono y nombre del cliente para registrarlo 
 chatbot responde venta validad (Matching de datos de codigo de seguridad y monto)

2.¿Que es el codigoServicio?

Es el codigo mas los tres ultimos digitos del telefono por ejemplo estos datos, estos telefonos solo se encargan de recibir dinero y con el aplicativo movil escuchar las notificaciones y enviarlos a el lambda de notificaciones que luego se hara uso para el match pero esto no llega junto con la notificacion llega de manera hardcodeada o configurada en la aplicacion, en la tabla de dynamo este dato se guarda como codigo_dispositivo no como codigoServicio

Ejemplo: llega notificacion:  "Recibiste S/100.00 de Jesus F. Anthony C. - Yape. Código de seguridad: 098"
         el telefono enviara  estos datos 
         {
            texto: Recibiste S/100.00 de Jesus F. Anthony C. - Yape. Código de seguridad: 098
            codigo_dispositivo: TK1-320
         }

Telefonos

OVERSHARK
L1-000 
L2-378
L3-711
L4-138
P1/556
P1-A/375
P2/576Oadyuawd!"#12214adaw
P3/825
P4/101
P4-A/262
P5/795
TK1/320
TK2/505
TK3/016
TK6/600

BRAVO'S
PUB BRAV/829
LIVE BRAV/402

3.Para el formato de notificación

    Las notificaciones llegan con este dato eso es todo y como explique en la segunda pregunta
    {
    "texto": "Recibiste S/100.00 de Jesus F. Anthony C. - Yape. Código de seguridad: 098"
    }