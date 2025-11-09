precision mediump float;

uniform float time;
uniform vec3 color;
uniform float audioLevel;
varying vec3 vNormal;
varying vec3 vPosition;

void main(){
    vec3 viewDirection=normalize(cameraPosition-vPosition);
    float fresnel=1.-max(0.,dot(viewDirection,vNormal));
    fresnel=pow(fresnel,2.+audioLevel*2.);
    
    float pulse=.8+.2*sin(time*2.);
    
    vec3 finalColor=color*fresnel*pulse*(1.+audioLevel*.8);
    
    float alpha=fresnel*(.7-audioLevel*.3);
    
    gl_FragColor=vec4(finalColor,alpha);
}