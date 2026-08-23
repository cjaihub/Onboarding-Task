allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir("../../build")
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}
subprojects {
    project.evaluationDependsOn(":app")
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}

subprojects {
    val androidExt = project.extensions.findByName("android")
    if (androidExt != null) {
        try {
            val setCompileSdk = androidExt.javaClass.getMethod("setCompileSdk", Int::class.java)
            setCompileSdk.invoke(androidExt, 37)
        } catch (e: Exception) {}
        
        try {
            val setCompileSdkVersion = androidExt.javaClass.getMethod("setCompileSdkVersion", Int::class.java)
            setCompileSdkVersion.invoke(androidExt, 37)
        } catch (e: Exception) {}
    }
}
