package com.senai.lucas.maoamiga.controller;

import com.senai.lucas.maoamiga.dto.PontoRequestDTO;
import com.senai.lucas.maoamiga.dto.PontoResponseDTO;
import com.senai.lucas.maoamiga.service.PontoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(value = "/api/v1/pontos")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class PontoController {

    private final PontoService pontoService;

    @GetMapping
    public ResponseEntity<List<PontoResponseDTO>> findAll() {
        return ResponseEntity.ok(pontoService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PontoResponseDTO> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(pontoService.findById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PontoResponseDTO save(@Valid @RequestBody PontoRequestDTO ponto) {
        return pontoService.save(ponto);
    }

    @PutMapping("/{id}")
    public PontoResponseDTO update(
            @PathVariable UUID id,
            @Valid @RequestBody PontoRequestDTO ponto
    ) {
        return pontoService.update(id, ponto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        pontoService.delete(id);
    }
}

