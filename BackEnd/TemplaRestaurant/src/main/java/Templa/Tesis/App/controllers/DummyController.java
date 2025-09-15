package Templa.Tesis.App.controllers;

import Templa.Tesis.App.dtos.DummyDto;
import Templa.Tesis.App.servicies.DummyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/dummy")
public class DummyController {

    @Autowired
    private DummyService dummyService;


    @GetMapping("")
    public ResponseEntity<DummyDto> getDummy(){
        return null;
    }

    @GetMapping("{id}")
    public ResponseEntity<DummyDto> getDummy(Long id){
        return null;
    }

    @PostMapping("")
    public ResponseEntity<DummyDto> createDummy(DummyDto dummyDto){
        return null;
    }

    @PutMapping("")
    public ResponseEntity<DummyDto> updateDummy(DummyDto dummyDto){
        return null;
    }

    @DeleteMapping("")
    public ResponseEntity<DummyDto> deleteDummy(DummyDto dummyDto){
        return null;
    }



}
